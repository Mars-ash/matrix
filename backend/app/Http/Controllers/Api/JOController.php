<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreJORequest;
use App\Http\Resources\JOResource;
use App\Models\Activity;
use App\Models\JO;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JOController extends Controller
{
    public function store(StoreJORequest $request, Project $project): JsonResponse
    {
        $jo = DB::transaction(function () use ($request, $project) {
            $jo = $project->jos()->create([
                'jo_number' => $request->validated('joNumber'),
                'product' => $request->validated('product'),
                'type' => $request->validated('type'),
                'target_date' => $request->validated('targetDate'),
            ]);

            $categories = $request->validated('categories', []);
            $catLabels = [];

            foreach ($categories as $idx => $cat) {
                $jo->categories()->create([
                    'label' => $cat['label'],
                    'kind' => $cat['kind'],
                    'is_custom' => $cat['isCustom'] ?? false,
                    'sort_order' => $idx + 1,
                ]);
                $catLabels[] = $cat['label'];
            }

            $catSuffix = count($catLabels) ? ' with categories: ' . implode(', ', $catLabels) : '';
            Activity::create([
                'jo_id' => $jo->id,
                'message' => "JO {$jo->jo_number} created{$catSuffix}.",
            ]);

            return $jo;
        });

        return response()->json([
            'data' => new JOResource($jo->load([
                'categories.items.controls.poTracking',
                'activities',
            ])),
            'message' => 'Job Order created successfully.',
        ], 201);
    }

    public function show(JO $jo): JOResource
    {
        return new JOResource($jo->load([
            'categories.items.controls.poTracking',
            'categories.items.controls.photos',
            'activities',
        ]));
    }

    public function finish(Request $request, JO $jo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $now = Carbon::now()->format('Y-m-d');
        $jo->update(['finish_date' => $now]);

        Activity::create([
            'jo_id' => $jo->id,
            'message' => "JO {$jo->jo_number} marked as Finished on {$now}.",
        ]);

        return response()->json([
            'data' => new JOResource($jo->load([
                'categories.items.controls.poTracking',
                'activities',
            ])),
            'message' => 'Job Order finished successfully.',
        ]);
    }
}
