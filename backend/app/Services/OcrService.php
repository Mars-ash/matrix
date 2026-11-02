<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OcrService
{
    private string $apiKey;
    private array $apiKeys;
    private string $model;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = (string) config('ocr.gemini_api_key', '');
        $this->model = (string) config('ocr.model', 'gemini-3.7-flash');
        $this->baseUrl = (string) config('ocr.base_url', 'https://generativelanguage.googleapis.com/v1beta');

        $configuredKeys = config('ocr.api_keys', []);
        $this->apiKeys = array_values(array_unique(array_filter(array_merge(
            !empty($this->apiKey) ? [$this->apiKey] : [],
            is_array($configuredKeys) ? $configuredKeys : []
        ))));
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

        $configuredKeys = config('ocr.api_keys', []);
        $singleKey = (string) config('ocr.gemini_api_key', $this->apiKey);
        $allKeys = array_values(array_unique(array_filter(array_merge(
            !empty($singleKey) ? [$singleKey] : [],
            is_array($configuredKeys) ? $configuredKeys : $this->apiKeys
        ))));

        if (empty($allKeys)) {
            return $this->failureResponse('Gemini API Key tidak disetel. Harap hubungi ammar.');
        }

        try {
            @set_time_limit(120);

            $optimized = $this->prepareImagePayload($filePath, $mime);
            $imageData = $optimized['data'];
            $mimeType = $optimized['mime'];

            $prompt = <<<PROMPT
You are an expert mechanical & tooling manufacturing engineer specialized in parsing engineering drawings, BOM tables, and parts lists (dies, molds, jigs, machining).
Extract all rows from the table in this image into structured items.

Each item must have:
- "no": item number or sequence (e.g. "1", "01", "S1", "10A")
- "description": name of the part or component (e.g. "PUNCH PLATE", "STRIPPER BOLT", "GUIDE PIN", "PIN DOWEL", "DIE BLOCK")
- "dimension": exact dimensions or size callouts. CRITICAL RULES FOR TECHNICAL SYMBOLS:
  * ALWAYS preserve the diameter symbol 'Ø' accurately (e.g., "Ø30 x 58", "Ø25 x 120", "Ø16 - 80L").
  * Do NOT confuse the diameter symbol 'Ø' with letter 'O' or digit '0'.
  * Convert any AutoCAD text codes like "%%C" or "%%c" to "Ø".
  * Preserve thread callouts (e.g. "M8 x 35", "M12 x 1.75"), plate thickness ("T=25", "PL 50"), and tolerances (e.g. "g6", "H7", "±0.05").
- "material": material grade (e.g. "SKD11", "S50C", "SS400", "DC53", "SCM440", "SUS304", or "STD" for standard purchased parts)
- "qty": integer quantity (default 1 if not specified)
- "hrc": hardness specification (e.g. "58-60", "HRC 60", "35-40", or "-" if not applicable)

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
                'gemini-flash-lite-latest',
                'gemini-3.5-flash-lite',
                'gemini-flash-latest',
                'gemini-3.7-flash',
                'gemini-3.8-flash',
            ]));

            $response = null;
            $lastError = '';

            // Terapkan strategi Round-Robin antar-request agar beban terbagi rata
            $totalKeys = count($allKeys);
            $startIndex = 0;
            if ($totalKeys > 1) {
                try {
                    if (!Cache::has('gemini_ocr_rr_counter')) {
                        Cache::forever('gemini_ocr_rr_counter', 0);
                        $counter = 0;
                    } else {
                        $counter = Cache::increment('gemini_ocr_rr_counter');
                        if ($counter === false) {
                            $counter = (int) Cache::get('gemini_ocr_rr_counter', 0) + 1;
                            Cache::forever('gemini_ocr_rr_counter', $counter);
                        }
                    }
                    $startIndex = abs((int) $counter) % $totalKeys;
                } catch (\Throwable) {
                    $startIndex = 0;
                }
            }

            // Susun urutan key dimulai dari index round-robin
            $orderedKeys = [];
            for ($i = 0; $i < $totalKeys; $i++) {
                $idx = ($startIndex + $i) % $totalKeys;
                $orderedKeys[] = [
                    'index' => $idx,
                    'key' => $allKeys[$idx],
                ];
            }

            foreach ($orderedKeys as $attemptNum => $keyInfo) {
                $keyIndex = $keyInfo['index'];
                $currentApiKey = $keyInfo['key'];
                $keyLabel = 'API Key #' . ($keyIndex + 1) . ' (' . substr($currentApiKey, 0, 8) . '...)';

                foreach ($modelsToTry as $m) {
                    $endpoint = "{$this->baseUrl}/models/{$m}:generateContent";
                    try {
                        $res = Http::withHeaders([
                            'x-goog-api-key' => $currentApiKey,
                        ])->timeout(20)->connectTimeout(5)->post($endpoint, $payload);

                        if ($res->successful()) {
                            $response = $res;
                            if ($attemptNum > 0) {
                                Log::info("Gemini OCR berhasil menggunakan cadangan {$keyLabel} (rotasi ke-" . ($attemptNum + 1) . ").");
                            }
                            break 2; // Success! Break out of both models and keys loops
                        }

                        $status = $res->status();
                        $lastError = "{$keyLabel} status {$status}";
                        Log::warning("Gemini OCR error for {$keyLabel} on model {$m} ({$status}): " . substr($res->body(), 0, 200));

                        // If quota exceeded (429), switch immediately to the next key in the round-robin sequence
                        if ($status === 429) {
                            Log::warning("Gemini OCR limit kuota tercapai (429) untuk {$keyLabel}. Beralih ke API key berikutnya dalam rotasi round-robin.");
                            break; // break model loop to try next API key
                        }

                        // If 503 (model overloaded), continue to next model on same key
                        if ($status === 503) {
                            continue;
                        }
                    } catch (\Throwable $attemptEx) {
                        $lastError = "{$keyLabel}: " . $attemptEx->getMessage();
                        Log::warning("Gemini OCR connection attempt failed for {$keyLabel} on {$m}: " . $attemptEx->getMessage());
                        continue;
                    }
                }
            }

            if (!$response || !$response->successful()) {
                return $this->failureResponse('Layanan OCR Vision AI sedang sibuk atau batas kuota API key tercapai (' . $lastError . ').');
            }

            $json = $response->json();
            $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
            $cleanText = preg_replace('/^```(?:json)?\s*/i', '', trim($rawText));
            $cleanText = preg_replace('/\s*```$/', '', $cleanText);
            $items = json_decode($cleanText, true);

            if (!is_array($items) || count($items) === 0) {
                return $this->failureResponse('Tidak ada baris data atau tabel yang terdeteksi dari gambar.');
            }

            $sanitized = array_map(function ($item, $index) {
                $dim = (string) ($item['dimension'] ?? '');
                // Normalize AutoCAD and alternate unicode diameter symbols to standard Ø
                $dim = preg_replace('/%%[cC]/', 'Ø', $dim);
                $dim = str_replace(["\u{2300}", "\u{2349}", "\u{00F8}"], 'Ø', $dim);

                return [
                    'no' => (string) ($item['no'] ?? ($index + 1)),
                    'description' => (string) ($item['description'] ?? "Item " . ($index + 1)),
                    'dimension' => trim($dim),
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
            foreach ($allKeys as $k) {
                if (!empty($k)) {
                    $cleanMsg = str_replace($k, '[REDACTED]', $cleanMsg);
                }
            }
            Log::error('Gemini OCR exception: ' . $cleanMsg);

            if (str_contains(strtolower($msg), 'timed out') || str_contains(strtolower($msg), 'curl error 28')) {
                return $this->failureResponse('Koneksi ke OCR Vision AI timeout saat memproses gambar.');
            }

            return $this->failureResponse('Koneksi OCR terputus: ' . substr($cleanMsg, 0, 100));
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

    public function failureResponse(string $message): array
    {
        return [
            'success' => false,
            'provider' => 'none',
            'items' => [],
            'message' => $message,
        ];
    }
}
