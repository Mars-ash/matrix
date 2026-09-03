<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Activity;
use App\Models\JO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function store(Request $request, JO $jo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'kind' => ['required', 'in:Part,Component'],
            'isCustom' => ['nullable', 'boolean'],
        ]);

        $maxOrder = $jo->categories()->max('sort_order') ?? 0;

        $category = $jo->categories()->create([
            'label' => $validated['label'],
            'kind' => $validated['kind'],
            'is_custom' => $validated['isCustom'] ?? true,
            'sort_order' => $maxOrder + 1,
        ]);

        Activity::create([
            'jo_id' => $jo->id,
            'message' => "Category \"{$category->label}\" added.",
        ]);

        return response()->json([
            'data' => new CategoryResource($category->load('items.controls')),
            'message' => 'Category added successfully.',
        ], 201);
    }
}
