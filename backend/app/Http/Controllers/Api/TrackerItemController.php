<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ItemResource;
use App\Http\Resources\JOResource;
use App\Http\Resources\ProjectResource;
use App\Models\Activity;
use App\Models\Category;
use App\Models\PoTracking;
use App\Services\TrackerItemService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrackerItemController extends Controller
{
    public function store(Request $request, TrackerItemService $service): JsonResponse
    {
        $validated = $request->validate([
            'tracker'         => ['required', 'in:po,subcont'],
            'categoryId'      => ['nullable', 'uuid', 'exists:categories,id'],
            'kind'            => ['nullable', 'in:Part,Component'],
            'id'              => ['nullable', 'uuid'],
            'no'              => ['nullable', 'string', 'max:50'],
            'description'     => ['required', 'string', 'max:255'],
            'dimension'       => ['nullable', 'string', 'max:100'],
            'material'        => ['nullable', 'string', 'max:100'],
            'qty'             => ['nullable', 'integer', 'min:1'],
            'hrc'             => ['nullable', 'string', 'max:50'],
            'targetArrival'   => ['nullable', 'date'],
            'subcontNotes'    => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($validated, $service) {
            $tracker = $validated['tracker'];
            $categoryId = $validated['categoryId'] ?? null;
            $kind = $tracker === 'subcont' ? 'Part' : ($validated['kind'] ?? 'Part');

            $category = $categoryId
                ? Category::findOrFail($categoryId)
                : $service->unassignedCategory($kind);

            $item = $service->createItem($category, $validated);

            if ($tracker === 'po' && !empty($validated['targetArrival'])) {
                $primaryProcess = $category->kind === 'Part' ? 'Material' : 'PO';
                $primary = $item->controls()->where('process', $primaryProcess)->first();
                $arrival = $item->controls()->where('process', 'Arrival')->first();

                if ($primary) {
                    $primary->update(['target_date' => $validated['targetArrival']]);
                    PoTracking::create([
                        'control_id' => $primary->id,
                        'target_arrival' => $validated['targetArrival'],
                    ]);
                }
                if ($arrival) {
                    $arrival->update(['target_date' => $validated['targetArrival']]);
                }
            } elseif ($tracker === 'subcont') {
                $item->update([
                    'is_subcont' => true,
                    'subcont_status' => 'In Progress',
                    'subcont_dispatch_date' => now(),
                    'subcont_notes' => $validated['subcontNotes'] ?? null,
                    'arrival_target_date' => $validated['targetArrival'] ?? null,
                ]);
            }

            Activity::create([
                'jo_id' => $category->jo_id,
                'message' => "Item \"{$item->description}\" added via " . ($tracker === 'po' ? 'PO Tracker.' : 'Subcont Tracker.'),
            ]);

            $item->load(['controls.poTracking', 'controls.photos']);
            $jo = $category->jo;
            $project = $jo->project;

            return response()->json([
                'data' => [
                    'project' => new ProjectResource($project),
                    'jo' => new JOResource($jo),
                    'category' => new CategoryResource($category),
                    'item' => new ItemResource($item),
                ],
                'message' => 'Item added to tracker.',
            ], 201);
        });
    }
}
