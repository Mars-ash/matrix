<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\OcrService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OcrController extends Controller
{
    public function __construct(private readonly OcrService $ocrService)
    {
    }

    /**
     * Upload an image/table to extract items via OCR without saving to database yet.
     */
    public function upload(Request $request, string $category): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'max:10240'], // 10MB
            'kind' => ['nullable', 'string', 'in:Part,Component'],
        ]);

        $cat = \Illuminate\Support\Str::isUuid($category) ? Category::find($category) : null;
        $kind = $cat ? $cat->kind : ($request->input('kind') ?? 'Part');

        $file = $request->file('image');
        $result = $this->ocrService->extractItems($file, $kind);

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
        ]);
    }

    /**
     * General extract endpoint without category parameter.
     */
    public function extract(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'max:10240'],
            'kind' => ['nullable', 'string', 'in:Part,Component'],
        ]);

        $kind = $request->input('kind', 'Part');
        $file = $request->file('image');
        $result = $this->ocrService->extractItems($file, $kind);

        return response()->json([
            'success' => $result['success'],
            'provider' => $result['provider'],
            'items' => $result['items'],
            'message' => $result['message'] ?? 'Ekstraksi selesai.',
        ]);
    }
}
