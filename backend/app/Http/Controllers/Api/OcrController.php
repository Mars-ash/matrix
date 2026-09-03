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
    public function upload(Request $request, Category $category): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'image' => ['required', 'file', 'max:10240'], // 10MB
        ]);

        $file = $request->file('image');
        $result = $this->ocrService->extractItems($file, $category->kind);

        return response()->json([
            'success' => $result['success'],
            'provider' => $result['provider'],
            'category' => [
                'id' => $category->id,
                'label' => $category->label,
                'kind' => $category->kind,
            ],
            'items' => $result['items'],
            'message' => $result['message'] ?? 'Ekstraksi selesai.',
        ]);
    }
}
