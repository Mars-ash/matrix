<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubcontTrackerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Item::where('is_subcont', true)
            ->with([
                'category.jo.project',
                'controls' => fn ($q) => $q->where('process', 'Arrival'),
            ])
            ->latest('subcont_dispatch_date')
            ->get();

        $data = $items->map(function ($item) {
            $category = $item->category;
            $jo = $category?->jo;
            $project = $jo?->project;
            $arrivalControl = $item->controls->firstWhere('process', 'Arrival');

            return [
                'id' => $item->id,
                'projectId' => $project?->id,
                'projectName' => $project?->name ?? '',
                'customer' => $project?->customer ?? '',
                'joId' => $jo?->id,
                'joNumber' => $jo?->jo_number ?? '',
                'categoryId' => $category?->id,
                'categoryLabel' => $category?->label ?? '',
                'no' => $item->no,
                'description' => $item->description,
                'dimension' => $item->dimension,
                'material' => $item->material,
                'qty' => $item->qty,
                'hrc' => $item->hrc,
                'subcontSupplier' => $item->subcont_supplier,
                'subcontProcess' => $item->subcont_process,
                'subcontStatus' => $item->subcont_status ?? 'In Progress',
                'subcontDispatchDate' => $item->subcont_dispatch_date?->toISOString(),
                'subcontDoneAt' => $item->subcont_done_at?->toISOString(),
                'arrivalTargetDate' => $item->arrival_target_date?->format('Y-m-d') ?? $arrivalControl?->target_date?->format('Y-m-d'),
                'subcontNotes' => $item->subcont_notes,
            ];
        });

        return response()->json(['data' => $data]);
    }
}
