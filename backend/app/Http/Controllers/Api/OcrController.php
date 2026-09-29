<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\OcrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OcrController extends Controller
{
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    public function __construct(private readonly OcrService $ocrService)
    {
    }

    /**
     * Upload an image/table to extract items via OCR without saving to database yet.
     */
    public function upload(Request $request, string $category): JsonResponse
    {
        $this->validateOcrRequest($request);

        $cat = \Illuminate\Support\Str::isUuid($category) ? Category::find($category) : null;
        $kind = $cat ? $cat->kind : ($request->input('kind') ?? 'Part');

        $file = $request->file('image');
        $result = $this->ocrService->extractItems($file, $kind);
        $status = $result['success'] ? 200 : 422;

        return response()->json([
            'success' => $result['success'],
            'provider' => $result['provider'],
            'category' => [
                'id' => $cat ? $cat->id : $category,
                'label' => $cat ? $cat->label : 'Data Table',
                'kind' => $kind,
            ],
            'items' => $result['items'],
            'message' => $result['message'] ?? 'Ekstraksi selesai.',
        ], $status);
    }

    /**
     * General extract endpoint without category parameter.
     */
    public function extract(Request $request): JsonResponse
    {
        $this->validateOcrRequest($request);

        $kind = $request->input('kind', 'Part');
        $file = $request->file('image');
        $result = $this->ocrService->extractItems($file, $kind);
        $status = $result['success'] ? 200 : 422;

        return response()->json([
            'success' => $result['success'],
            'provider' => $result['provider'],
            'items' => $result['items'],
            'message' => $result['message'] ?? 'Ekstraksi selesai.',
        ], $status);
    }

    /**
     * Validate upload request: explicit consent, max size 15MB, and magic-bytes inspection.
     *
     * @throws ValidationException
     */
    private function validateOcrRequest(Request $request): void
    {
        $request->validate([
            'image' => ['required', 'file', 'max:15360'], // 15MB
            'consent' => ['required', 'boolean', 'accepted'],
            'kind' => ['nullable', 'string', 'in:Part,Component'],
        ], [
            'consent.accepted' => 'Persetujuan eksplisit pengguna diperlukan sebelum gambar dikirim ke server.',
            'consent.required' => 'Persetujuan eksplisit pengguna diperlukan sebelum gambar dikirim ke server.',
        ]);

        $file = $request->file('image');
        if (!$file || !$file->isValid()) {
            throw ValidationException::withMessages([
                'image' => ['File gambar tidak valid atau gagal diunggah.'],
            ]);
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $file->getRealPath());
        finfo_close($finfo);

        if (!in_array($realMime, self::ALLOWED_MIMES, true)) {
            throw ValidationException::withMessages([
                'image' => ['Format file tidak didukung. Harap upload format gambar valid (JPG, PNG, atau WebP).'],
            ]);
        }
    }
}
