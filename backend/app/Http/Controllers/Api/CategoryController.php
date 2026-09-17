<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Activity;
use App\Models\JO;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function store(Request $request, JO $jo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'id' => ['nullable', 'uuid'],
            'label' => ['required', 'string', 'max:255'],
            'kind' => ['required', 'in:Part,Component'],
            'isCustom' => ['nullable', 'boolean'],
        ]);

        $category = DB::transaction(function () use ($validated, $jo) {
            $kind = $validated['kind'];

            if ($kind === 'Part') {
                $firstComponent = $jo->categories()
                    ->where('kind', 'Component')
                    ->orderBy('sort_order')
                    ->first();

                if ($firstComponent) {
                    $targetOrder = $firstComponent->sort_order;
                    // Shift all subsequent categories down
                    $jo->categories()
                        ->where('sort_order', '>=', $targetOrder)
                        ->increment('sort_order');
                } else {
                    $maxOrder = $jo->categories()->max('sort_order') ?? 0;
                    $targetOrder = $maxOrder + 1;
                }
            } else {
                $maxOrder = $jo->categories()->max('sort_order') ?? 0;
                $targetOrder = $maxOrder + 1;
            }

            $catData = [
                'label' => $validated['label'],
                'kind' => $validated['kind'],
                'is_custom' => $validated['isCustom'] ?? true,
                'sort_order' => $targetOrder,
            ];
            if (!empty($validated['id'])) {
                $catData['id'] = $validated['id'];
            }

            return $jo->categories()->create($catData);
        });

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
