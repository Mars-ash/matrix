<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ItemResource;
use App\Models\Activity;
use App\Models\Category;
use App\Models\Control;
use App\Models\Item;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ItemController extends Controller
{
    private const PART_PROCESSES = ['Material', 'Arrival', 'Machining', 'Hardening', 'Grinding', 'Wirecut', 'Assembly'];
    private const COMPONENT_PROCESSES = ['PO', 'Arrival'];

    private function initControlsForItem(Item $item, string $kind): void
    {
        $processes = $kind === 'Part' ? self::PART_PROCESSES : self::COMPONENT_PROCESSES;

        foreach ($processes as $proc) {
            $status = ($proc === 'Material' || $proc === 'PO' || $proc === 'Arrival')
                ? 'Not Started'
                : '-';

            Control::create([
                'item_id' => $item->id,
                'process' => $proc,
                'status' => $status,
                'notes' => '',
            ]);
        }
    }

    public function store(Request $request, Category $category): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'no' => ['nullable', 'string', 'max:50'],
            'description' => ['required', 'string', 'max:255'],
            'dimension' => ['nullable', 'string', 'max:100'],
            'material' => ['nullable', 'string', 'max:100'],
            'qty' => ['nullable', 'integer', 'min:1'],
            'hrc' => ['nullable', 'string', 'max:50'],
        ]);

        $item = DB::transaction(function () use ($validated, $category) {
            $maxOrder = $category->items()->max('sort_order') ?? 0;

            $item = $category->items()->create([
                'no' => $validated['no'] ?? '-',
                'description' => $validated['description'],
                'dimension' => $validated['dimension'] ?? '',
                'material' => $validated['material'] ?? '',
                'qty' => $validated['qty'] ?? 1,
                'hrc' => $validated['hrc'] ?? '',
                'sort_order' => $maxOrder + 1,
            ]);

            $this->initControlsForItem($item, $category->kind);

            Activity::create([
                'jo_id' => $category->jo_id,
                'message' => "Item \"{$item->description}\" added to {$category->label}.",
            ]);

            return $item;
        });

        return response()->json([
            'data' => new ItemResource($item->load('controls.poTracking')),
            'message' => 'Item created successfully.',
        ], 201);
    }

    public function batchStore(Request $request, Category $category): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.no' => ['nullable', 'string', 'max:50'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.dimension' => ['nullable', 'string', 'max:100'],
            'items.*.material' => ['nullable', 'string', 'max:100'],
            'items.*.qty' => ['nullable', 'integer', 'min:1'],
            'items.*.hrc' => ['nullable', 'string', 'max:50'],
        ]);

        $createdItems = DB::transaction(function () use ($validated, $category) {
            $maxOrder = $category->items()->max('sort_order') ?? 0;
            $result = [];

            foreach ($validated['items'] as $idx => $itemData) {
                $item = $category->items()->create([
                    'no' => $itemData['no'] ?? (string) ($maxOrder + $idx + 1),
                    'description' => $itemData['description'],
                    'dimension' => $itemData['dimension'] ?? '',
                    'material' => $itemData['material'] ?? '',
                    'qty' => $itemData['qty'] ?? 1,
                    'hrc' => $itemData['hrc'] ?? '',
                    'sort_order' => $maxOrder + $idx + 1,
                ]);

                $this->initControlsForItem($item, $category->kind);
                $result[] = $item;
            }

            $count = count($result);
            Activity::create([
                'jo_id' => $category->jo_id,
                'message' => "Batch: {$count} items added to {$category->label}.",
            ]);

            return $result;
        });

        return response()->json([
            'data' => ItemResource::collection(
                Item::with('controls.poTracking')
                    ->whereIn('id', array_map(fn ($i) => $i->id, $createdItems))
                    ->get()
            ),
            'message' => count($createdItems) . ' items added successfully.',
        ], 201);
    }

    public function updateSubcont(Request $request, Item $item): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'isSubcont' => ['required', 'boolean'],
            'subcontNotes' => ['nullable', 'string'],
            'subcontSupplier' => ['nullable', 'string', 'max:255'],
            'subcontStatus' => ['nullable', 'in:In Progress,Done'],
            'subcontProcess' => ['nullable', 'string', 'max:100'],
            'qty' => ['nullable', 'integer', 'min:1'],
            'arrivalTargetDate' => ['nullable', 'date'],
        ]);

        $item = DB::transaction(function () use ($validated, $item) {
            $isSubcont = $validated['isSubcont'];
            $now = Carbon::now();

            $updateData = [
                'is_subcont' => $isSubcont,
                'subcont_notes' => $validated['subcontNotes'] ?? null,
                'subcont_supplier' => $validated['subcontSupplier'] ?? null,
                'subcont_status' => $validated['subcontStatus'] ?? ($isSubcont ? 'In Progress' : null),
                'subcont_process' => $validated['subcontProcess'] ?? null,
                'arrival_target_date' => $validated['arrivalTargetDate'] ?? null,
            ];

            if (isset($validated['qty'])) {
                $updateData['qty'] = $validated['qty'];
            }

            if ($isSubcont && !$item->subcont_dispatch_date) {
                $updateData['subcont_dispatch_date'] = $now;
            }

            if (($validated['subcontStatus'] ?? null) === 'Done') {
                $updateData['subcont_done_at'] = $now;
            }

            $item->update($updateData);

            // If subcontProcess is set, update that control status to In Progress SC (or Done)
            if ($isSubcont && !empty($validated['subcontProcess'])) {
                $ctrl = $item->controls()->where('process', $validated['subcontProcess'])->first();
                if ($ctrl) {
                    $ctrlStatus = ($validated['subcontStatus'] ?? '') === 'Done' ? 'Done' : 'In Progress SC';
                    $ctrl->update([
                        'status' => $ctrlStatus,
                        'in_progress_at' => $ctrl->in_progress_at ?? $now,
                    ]);
                }
            }

            $joId = $item->category->jo_id;
            $supplierName = $validated['subcontSupplier'] ? " to {$validated['subcontSupplier']}" : '';
            Activity::create([
                'jo_id' => $joId,
                'message' => $isSubcont
                    ? "Item \"{$item->description}\" assigned to Subcont{$supplierName}."
                    : "Item \"{$item->description}\" removed from Subcont.",
            ]);

            return $item;
        });

        return response()->json([
            'data' => new ItemResource($item->load('controls.poTracking')),
            'message' => 'Subcont status updated successfully.',
        ]);
    }
}
