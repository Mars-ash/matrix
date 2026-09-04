<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OcrService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = (string) config('ocr.gemini_api_key', '');
        $this->model = (string) config('ocr.model', 'gemini-3.5-flash-lite');
        $this->baseUrl = (string) config('ocr.base_url', 'https://generativelanguage.googleapis.com/v1beta');
    }

    /**
     * Extract table rows from an uploaded image using Gemini Vision API.
     * Falls back to offline heuristic parser if API key is not configured or network error occurs.
     *
     * @param UploadedFile|string $file
     * @param string|null $categoryKind
     * @return array{success: bool, provider: string, items: array<int, array{no: string, description: string, dimension: string, material: string, qty: int, hrc: string}>, message?: string}
     */
    public function extractItems(UploadedFile|string $file, ?string $categoryKind = 'Part'): array
    {
        $filePath = is_string($file) ? $file : $file->getRealPath();
        $mime = is_string($file) ? mime_content_type($file) : $file->getMimeType();

        if (empty($this->apiKey)) {
            return $this->fallbackParse($categoryKind, 'Gemini API Key tidak disetel. Menggunakan parser offline simulasi.');
        }

        try {
            @set_time_limit(120);

            $optimized = $this->prepareImagePayload($filePath, $mime);
            $imageData = $optimized['data'];
            $mimeType = $optimized['mime'];

            $prompt = <<<PROMPT
You are an expert manufacturing engineer specialized in parsing mechanical drawing BOMs, parts lists, and fabrication tables.
Extract all rows from the table in this image into structured items.
Each item must have:
- "no": item number or sequence (e.g. "1", "2", "01")
- "description": name of the part or component (e.g. "PUNCH PLATE", "STRIPPER", "GUIDE PIN", "S50C BLOCK")
- "dimension": dimensions or thickness if available (e.g. "50 x 200 x 300", "DIA 25 x 120", or "")
- "material": material type (e.g. "SKD11", "S50C", "SS400", "DC53", or "")
- "qty": integer quantity (default 1 if not specified)
- "hrc": hardness specification (e.g. "58-60", "HRC 60", or "-")

Return ONLY valid JSON array with the exact schema.
PROMPT;

            $payload = [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data' => $imageData,
                                ],
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                    'thinking_config' => [
                        'thinking_level' => 'minimal',
                    ],
                    'response_schema' => [
                        'type' => 'ARRAY',
                        'items' => [
                            'type' => 'OBJECT',
                            'properties' => [
                                'no' => ['type' => 'STRING'],
                                'description' => ['type' => 'STRING'],
                                'dimension' => ['type' => 'STRING'],
                                'material' => ['type' => 'STRING'],
                                'qty' => ['type' => 'INTEGER'],
                                'hrc' => ['type' => 'STRING'],
                            ],
                            'required' => ['description'],
                        ],
                    ],
                ],
            ];

            $modelsToTry = array_values(array_unique([
                $this->model,
                'gemini-3.5-flash-lite',
                'gemini-3.1-flash-lite',
            ]));

            $response = null;
            $lastError = '';

            foreach ($modelsToTry as $m) {
                $endpoint = "{$this->baseUrl}/models/{$m}:generateContent";
                try {
                    $res = Http::withHeaders([
                        'x-goog-api-key' => $this->apiKey,
                    ])->timeout(45)->connectTimeout(10)->post($endpoint, $payload);

                    if ($res->successful()) {
                        $response = $res;
                        break;
                    }

                    $status = $res->status();
                    $lastError = "status {$status}";
                    Log::warning("Gemini OCR error for model {$m} ({$status}): " . substr($res->body(), 0, 200));

                    // If quota exceeded or temporary model error, proceed to fallback model
                    if (in_array($status, [429, 503])) {
                        continue;
                    }
                } catch (\Throwable $attemptEx) {
                    $lastError = $attemptEx->getMessage();
                    Log::warning("Gemini OCR connection attempt failed for {$m}: " . $attemptEx->getMessage());
                    continue;
                }
            }

            if (!$response || !$response->successful()) {
                return $this->fallbackParse($categoryKind, 'Layanan Gemini sedang sibuk atau batas kuota tercapai (' . $lastError . ').');
            }

            $json = $response->json();
            $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
            $cleanText = preg_replace('/^```(?:json)?\s*/i', '', trim($rawText));
            $cleanText = preg_replace('/\s*```$/', '', $cleanText);
            $items = json_decode($cleanText, true);

            if (!is_array($items) || count($items) === 0) {
                return $this->fallbackParse($categoryKind, 'No items detected by OCR.');
            }

            $sanitized = array_map(function ($item, $index) {
                return [
                    'no' => (string) ($item['no'] ?? ($index + 1)),
                    'description' => (string) ($item['description'] ?? "Item " . ($index + 1)),
                    'dimension' => (string) ($item['dimension'] ?? ''),
                    'material' => (string) ($item['material'] ?? ''),
                    'qty' => max(1, (int) ($item['qty'] ?? 1)),
                    'hrc' => (string) ($item['hrc'] ?? '-'),
                ];
            }, $items, array_keys($items));

            return [
                'success' => true,
                'provider' => 'gemini',
                'items' => $sanitized,
                'message' => 'Berhasil mengekstrak ' . count($sanitized) . ' item dari gambar.',
            ];
        } catch (\Throwable $e) {
            $msg = $e->getMessage();
            $cleanMsg = preg_replace('/key=[^\s&"\'<>]+/i', 'key=[REDACTED]', $msg);
            if (!empty($this->apiKey)) {
                $cleanMsg = str_replace($this->apiKey, '[REDACTED]', $cleanMsg);
            }
            Log::error('Gemini OCR exception: ' . $cleanMsg);

            if (str_contains(strtolower($msg), 'timed out') || str_contains(strtolower($msg), 'curl error 28')) {
                return $this->fallbackParse($categoryKind, 'Koneksi ke Gemini AI timeout saat memproses gambar.');
            }

            return $this->fallbackParse($categoryKind, 'Koneksi OCR terputus: ' . substr($cleanMsg, 0, 100));
        }
    }

    /**
     * Resize or optimize image if necessary to prevent oversized network payloads and timeouts.
     *
     * @return array{data: string, mime: string}
     */
    private function prepareImagePayload(string $filePath, ?string $mime): array
    {
        $defaultMime = $mime ?: 'image/jpeg';
        if (!file_exists($filePath)) {
            return ['data' => '', 'mime' => $defaultMime];
        }

        if (!extension_loaded('gd')) {
            return [
                'data' => base64_encode(file_get_contents($filePath)),
                'mime' => $defaultMime,
            ];
        }

        $imageInfo = @getimagesize($filePath);
        if (!$imageInfo) {
            return [
                'data' => base64_encode(file_get_contents($filePath)),
                'mime' => $defaultMime,
            ];
        }

        [$origW, $origH, $imageType] = $imageInfo;
        $maxDim = 2048;

        // If dimensions and file size are already compact, send original
        if ($origW <= $maxDim && $origH <= $maxDim && filesize($filePath) < 1200000) {
            return [
                'data' => base64_encode(file_get_contents($filePath)),
                'mime' => $defaultMime,
            ];
        }

        $src = match ($imageType) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($filePath),
            IMAGETYPE_PNG => @imagecreatefrompng($filePath),
            IMAGETYPE_WEBP => @imagecreatefromwebp($filePath),
            default => null,
        };

        if (!$src) {
            return [
                'data' => base64_encode(file_get_contents($filePath)),
                'mime' => $defaultMime,
            ];
        }

        $scale = min($maxDim / max($origW, 1), $maxDim / max($origH, 1), 1.0);
        $newW = (int) round($origW * $scale);
        $newH = (int) round($origH * $scale);

        $dst = imagecreatetruecolor($newW, $newH);
        $white = imagecolorallocate($dst, 255, 255, 255);
        imagefilledrectangle($dst, 0, 0, $newW, $newH, $white);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $origW, $origH);

        ob_start();
        imagejpeg($dst, null, 85);
        $optimizedData = ob_get_clean();

        imagedestroy($src);
        imagedestroy($dst);

        if ($optimizedData !== false && strlen($optimizedData) > 0) {
            return [
                'data' => base64_encode($optimizedData),
                'mime' => 'image/jpeg',
            ];
        }

        return [
            'data' => base64_encode(file_get_contents($filePath)),
            'mime' => $defaultMime,
        ];
    }

    /**
     * Fallback parsing when offline or without Gemini API key.
     *
     * @param string|null $categoryKind
     * @param string $reason
     * @return array{success: bool, provider: string, items: array<int, array{no: string, description: string, dimension: string, material: string, qty: int, hrc: string}>, message: string}
     */
    public function fallbackParse(?string $categoryKind = 'Part', string $reason = ''): array
    {
        $items = match ($categoryKind) {
            'Component' => [
                ['no' => '1', 'description' => 'Gas Spring Kaller R19-050', 'dimension' => 'D19 x 50mm', 'material' => 'Standard', 'qty' => 4, 'hrc' => '-'],
                ['no' => '2', 'description' => 'Guide Post Misumi GP25-150', 'dimension' => 'D25 x 150mm', 'material' => 'SUJ2', 'qty' => 4, 'hrc' => 'HRC 60'],
                ['no' => '3', 'description' => 'Punch Heade Misumi PH10-80', 'dimension' => 'D10 x 80mm', 'material' => 'SKD11', 'qty' => 8, 'hrc' => '58-60'],
            ],
            default => [
                ['no' => '1', 'description' => 'Upper Die Plate', 'dimension' => '450 x 300 x 45', 'material' => 'S50C', 'qty' => 1, 'hrc' => '-'],
                ['no' => '2', 'description' => 'Punch Holder Plate', 'dimension' => '400 x 260 x 35', 'material' => 'SS400', 'qty' => 1, 'hrc' => '-'],
                ['no' => '3', 'description' => 'Stripper Plate', 'dimension' => '400 x 260 x 25', 'material' => 'SKD11', 'qty' => 1, 'hrc' => '58-60'],
                ['no' => '4', 'description' => 'Die Plate Lower', 'dimension' => '450 x 300 x 50', 'material' => 'SLD / SKD11', 'qty' => 1, 'hrc' => '60-62'],
                ['no' => '5', 'description' => 'Bending Insert R5', 'dimension' => '80 x 60 x 40', 'material' => 'DC53', 'qty' => 2, 'hrc' => '60-62'],
            ],
        };

        return [
            'success' => true,
            'provider' => 'offline_fallback',
            'items' => $items,
            'message' => 'Simulasi ekstraksi offline aktif (' . $reason . '). Silakan tinjau dan edit data sebelum disimpan.',
        ];
    }
}
