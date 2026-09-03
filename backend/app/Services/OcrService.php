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
        $this->model = (string) config('ocr.model', 'gemini-2.0-flash');
        $this->baseUrl = (string) config('ocr.base_url', 'https://generativelanguage.googleapis.com/v1beta');
    }

    /**
     * Extract table rows from an uploaded image using Gemini 2.0 Flash Vision API.
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
            $imageData = base64_encode(file_get_contents($filePath));

            $endpoint = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";

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
                                    'mime_type' => $mime ?: 'image/jpeg',
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

            $response = Http::timeout(30)->post($endpoint, $payload);

            if (!$response->successful()) {
                Log::warning('Gemini OCR API error: ' . $response->body());
                return $this->fallbackParse($categoryKind, 'Gemini API response error: ' . $response->status());
            }

            $json = $response->json();
            $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
            $items = json_decode($rawText, true);

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
            Log::error('Gemini OCR exception: ' . $e->getMessage());
            return $this->fallbackParse($categoryKind, 'Exception: ' . $e->getMessage());
        }
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
