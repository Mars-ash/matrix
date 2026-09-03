<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Control;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PoTrackerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $controls = Control::whereIn('process', ['Material', 'PO'])
            ->with([
                'poTracking',
                'item.category.jo.project',
                'item.controls' => fn ($q) => $q->where('process', 'Arrival'),
            ])
            ->latest('updated_at')
            ->get();

        $data = $controls->map(function ($ctrl) {
            $item = $ctrl->item;
            $category = $item?->category;
            $jo = $category?->jo;
            $project = $jo?->project;
            $poTracking = $ctrl->poTracking;
            $arrivalControl = $item?->controls->firstWhere('process', 'Arrival');
            $trackingStatus = match ($arrivalControl?->status) {
                'Done' => 'Done',
                'Problem' => 'Problem',
                default => ($ctrl->status === 'Done' || !empty($poTracking?->po_no)) ? 'In Progress' : $ctrl->status,
            };

            return [
                'controlId' => $ctrl->id,
                'arrivalControlId' => $arrivalControl?->id,
                'process' => $ctrl->process,
                'status' => $trackingStatus,
                'poStatus' => $ctrl->status,
                'arrivalStatus' => $arrivalControl?->status ?? 'Not Started',
                'problemNotes' => $arrivalControl?->notes ?: ($ctrl->notes ?? ''),
                'projectId' => $project?->id,
                'projectName' => $project?->name ?? '',
                'customer' => $project?->customer ?? '',
                'joId' => $jo?->id,
                'joNumber' => $jo?->jo_number ?? '',
                'categoryId' => $category?->id,
                'categoryLabel' => $category?->label ?? '',
                'itemId' => $item?->id,
                'itemNo' => $item?->no ?? '',
                'description' => $item?->description ?? '',
                'dimension' => $item?->dimension ?? '',
                'material' => $item?->material ?? '',
                'qty' => $item?->qty ?? 1,
                'hrc' => $item?->hrc ?? '',
                'supplier' => $poTracking?->supplier ?? '',
                'poNo' => $poTracking?->po_no ?? '',
                'poDate' => $poTracking?->po_date?->format('Y-m-d') ?? '',
                'targetArrival' => $poTracking?->target_arrival?->format('Y-m-d') ?? $arrivalControl?->target_date?->format('Y-m-d') ?? '',
                'notes' => $poTracking?->notes ?? '',
            ];
        });

        return response()->json(['data' => $data]);
    }
}
