<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Control;
use App\Models\Item;
use App\Models\JO;
use App\Models\PoTracking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BulkActionController extends Controller
{
    public function bulkSendPo(Request $request, JO $jo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'itemIds' => ['required', 'array', 'min:1'],
            'itemIds.*' => ['required', 'string'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'poNo' => ['nullable', 'string', 'max:255'],
            'poDate' => ['nullable', 'date'],
            'targetArrival' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $itemIds = $validated['itemIds'];
        $now = Carbon::now();

        // Validate items are not already sent to PO
        $existingItems = Item::with(['category', 'controls.poTracking'])
            ->whereIn('id', $itemIds)
            ->get();

        $alreadySentPo = [];
        foreach ($existingItems as $item) {
            $primaryProcess = $item->category?->kind === 'Component' ? 'PO' : 'Material';
            $ctrl = $item->controls->first(fn ($c) => $c->process === $primaryProcess || $c->process === 'PO' || $c->process === 'Material');
            if ($ctrl && ($ctrl->status === 'Done' || $ctrl->poTracking !== null)) {
                $alreadySentPo[] = [
                    'id' => $item->id,
                    'no' => $item->no,
                    'description' => $item->description,
                ];
            }
        }

        if (!empty($alreadySentPo)) {
            return response()->json([
                'message' => 'Beberapa part/komponen sudah pernah dikirim PO dan tidak dapat dikirim ulang.',
                'already_sent_items' => $alreadySentPo,
            ], 422);
        }

        DB::transaction(function () use ($validated, $itemIds, $jo, $now) {
            $items = Item::with('controls')->whereIn('id', $itemIds)->get();

            foreach ($items as $item) {
                // Find PO or Material control
                $ctrl = $item->controls->first(fn ($c) => $c->process === 'Material' || $c->process === 'PO');

                if ($ctrl) {
                    $ctrl->update([
                        'status' => 'Done',
                        'done_at' => $ctrl->done_at ?? $now,
                        'in_progress_at' => $ctrl->in_progress_at ?? $now,
                    ]);

                    PoTracking::updateOrCreate(
                        ['control_id' => $ctrl->id],
                        [
                            'supplier' => $validated['supplier'] ?? null,
                            'po_no' => $validated['poNo'] ?? null,
                            'po_date' => $validated['poDate'] ?? null,
                            'target_arrival' => $validated['targetArrival'] ?? null,
                            'notes' => $validated['notes'] ?? null,
                        ]
                    );
                }

                // When PO is sent, transition Arrival process to In Progress
                $arrivalCtrl = $item->controls->first(fn ($c) => $c->process === 'Arrival');
                if ($arrivalCtrl) {
                    $arrivalData = [
                        'status' => 'In Progress',
                        'in_progress_at' => $arrivalCtrl->in_progress_at ?? $now,
                    ];
                    if (!empty($validated['targetArrival'])) {
                        $arrivalData['target_date'] = $validated['targetArrival'];
                    }
                    $arrivalCtrl->update($arrivalData);
                }

                if (!empty($validated['targetArrival'])) {
                    $item->update(['arrival_target_date' => $validated['targetArrival']]);
                } else {
                    $item->touch();
                }
            }

            $count = count($items);
            $sup = $validated['supplier'] ?? 'Supplier';
            $poNoText = $validated['poNo'] ? " (PO: {$validated['poNo']})" : '';
            Activity::create([
                'jo_id' => $jo->id,
                'message' => "Kirim PO: {$count} items to {$sup}{$poNoText}.",
            ]);
        });

        return response()->json([
            'message' => 'Bulk PO sent successfully for ' . count($itemIds) . ' items.',
        ]);
    }

    public function bulkUpdateStatus(Request $request, JO $jo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'itemIds' => ['required', 'array', 'min:1'],
            'itemIds.*' => ['required', 'string'],
            'processes' => ['required', 'array', 'min:1'],
            'processes.*' => ['required', 'string'],
            'status' => ['required', 'string', 'in:-,Not Started,In Progress,In Progress SC,Done,Problem'],
            'notes' => ['nullable', 'string'],
        ]);

        $itemIds = $validated['itemIds'];
        $processes = $validated['processes'];
        $status = $validated['status'];
        $notes = $validated['notes'] ?? '';
        $now = Carbon::now();

        DB::transaction(function () use ($itemIds, $processes, $status, $notes, $jo, $now) {
            Control::whereIn('item_id', $itemIds)
                ->whereIn('process', $processes)
                ->update([
                    'status' => $status,
                    'notes' => $notes,
                    'in_progress_at' => in_array($status, ['In Progress', 'In Progress SC']) ? $now : null,
                ]);

            Item::whereIn('id', $itemIds)->update(['updated_at' => $now]);

            $count = count($itemIds);
            $procList = implode(', ', $processes);
            Activity::create([
                'jo_id' => $jo->id,
                'message' => "Bulk status updated for {$count} items ({$procList}) → {$status}.",
            ]);
        });

        return response()->json([
            'message' => 'Bulk status updated successfully.',
        ]);
    }

    public function bulkSendSubcont(Request $request, JO $jo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'itemIds' => ['required', 'array', 'min:1'],
            'itemIds.*' => ['required', 'string'],
            'process' => ['required', 'string'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'arrivalTargetDate' => ['nullable', 'date'],
        ]);

        $itemIds = $validated['itemIds'];
        $process = $validated['process'];
        $supplier = $validated['supplier'] ?? null;
        $arrivalTargetDate = $validated['arrivalTargetDate'] ?? null;
        $now = Carbon::now();

        // Validate items are not already in subcont
        $existingItems = Item::with('controls')
            ->whereIn('id', $itemIds)
            ->get();

        $alreadySubcont = [];
        foreach ($existingItems as $item) {
            $ctrl = $item->controls->first(fn ($c) => $c->process === $process);
            if ($item->is_subcont || ($ctrl && $ctrl->status === 'In Progress SC')) {
                $alreadySubcont[] = [
                    'id' => $item->id,
                    'no' => $item->no,
                    'description' => $item->description,
                ];
            }
        }

        if (!empty($alreadySubcont)) {
            return response()->json([
                'message' => 'Beberapa part/komponen sudah aktif di Subcont dan tidak dapat dikirim ulang.',
                'already_sent_items' => $alreadySubcont,
            ], 422);
        }

        DB::transaction(function () use ($itemIds, $process, $supplier, $arrivalTargetDate, $jo, $now) {
            Item::whereIn('id', $itemIds)->update([
                'is_subcont' => true,
                'subcont_supplier' => $supplier,
                'subcont_process' => $process,
                'subcont_status' => 'In Progress',
                'subcont_dispatch_date' => $now,
                'arrival_target_date' => $arrivalTargetDate,
            ]);

            Control::whereIn('item_id', $itemIds)
                ->where('process', $process)
                ->update([
                    'status' => 'In Progress SC',
                    'in_progress_at' => $now,
                ]);

            $count = count($itemIds);
            $supName = $supplier ? " to {$supplier}" : '';
            Activity::create([
                'jo_id' => $jo->id,
                'message' => "Bulk Subcont: {$count} items sent{$supName} for {$process}.",
            ]);
        });

        return response()->json([
            'message' => 'Bulk subcont dispatched successfully.',
        ]);
    }

    public function bulkTargetArrival(Request $request, JO $jo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'itemIds' => ['required', 'array', 'min:1'],
            'itemIds.*' => ['required', 'string'],
            'targetDate' => ['required', 'date'],
        ]);

        $itemIds = $validated['itemIds'];
        $targetDate = $validated['targetDate'];

        DB::transaction(function () use ($itemIds, $targetDate, $jo) {
            Item::whereIn('id', $itemIds)->update(['arrival_target_date' => $targetDate]);

            Control::whereIn('item_id', $itemIds)
                ->where('process', 'Arrival')
                ->update(['target_date' => $targetDate]);

            $count = count($itemIds);
            Activity::create([
                'jo_id' => $jo->id,
                'message' => "Bulk Target Arrival set to {$targetDate} for {$count} items.",
            ]);
        });

        return response()->json([
            'message' => 'Bulk target arrival updated successfully.',
        ]);
    }
}
