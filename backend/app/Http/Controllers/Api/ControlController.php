<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ControlResource;
use App\Models\Activity;
use App\Models\Control;
use App\Models\ProcessPhoto;
use App\Services\PhotoUploadService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ControlController extends Controller
{
    public function updateStatus(Request $request, Control $control): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:-,Not Started,In Progress,In Progress SC,Done,Problem'],
            'notes' => ['nullable', 'string'],
        ]);

        $status = $validated['status'];
        $notes = $validated['notes'] ?? '';

        $control->update([
            'status' => $status,
            'notes' => $notes,
            'in_progress_at' => in_array($status, ['In Progress', 'In Progress SC']) ? ($control->in_progress_at ?? Carbon::now()) : $control->in_progress_at,
        ]);

        $item = $control->item;
        $joId = $item->category->jo_id;

        Activity::create([
            'jo_id' => $joId,
            'message' => "Item \"{$item->description}\" [{$control->process}] status changed to {$status}" . ($notes ? ": {$notes}" : '.'),
        ]);

        return response()->json([
            'data' => new ControlResource($control->load(['poTracking', 'photos'])),
            'message' => 'Control status updated successfully.',
        ]);
    }

    public function updateTargetDate(Request $request, Control $control): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'targetDate' => ['required', 'date'],
        ]);

        $control->update([
            'target_date' => $validated['targetDate'],
        ]);

        return response()->json([
            'data' => new ControlResource($control->load(['poTracking', 'photos'])),
            'message' => 'Target date updated successfully.',
        ]);
    }

    public function updatePoTracking(Request $request, Control $control): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:-,Not Started,In Progress,In Progress SC,Done,Problem'],
            'problemNotes' => ['nullable', 'string'],
            'supplier' => ['nullable', 'string', 'max:255'],
            'poNo' => ['nullable', 'string', 'max:255'],
            'poDate' => ['nullable', 'date'],
            'targetArrival' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'qty' => ['nullable', 'integer', 'min:1'],
        ]);

        DB::transaction(function () use ($validated, $control) {
            $control->update([
                'status' => $validated['status'],
                'notes' => $validated['problemNotes'] ?? $control->notes,
                'in_progress_at' => $validated['status'] === 'In Progress' ? ($control->in_progress_at ?? Carbon::now()) : $control->in_progress_at,
            ]);

            $control->poTracking()->updateOrCreate(
                ['control_id' => $control->id],
                [
                    'supplier' => $validated['supplier'] ?? null,
                    'po_no' => $validated['poNo'] ?? null,
                    'po_date' => $validated['poDate'] ?? null,
                    'target_arrival' => $validated['targetArrival'] ?? null,
                    'notes' => $validated['notes'] ?? ($validated['status'] === 'Problem' ? ($validated['problemNotes'] ?? null) : null),
                ]
            );

            if (isset($validated['qty'])) {
                $control->item->update(['qty' => $validated['qty']]);
            }

            $item = $control->item;
            $joId = $item->category->jo_id;
            Activity::create([
                'jo_id' => $joId,
                'message' => "PO Tracking updated for \"{$item->description}\" [{$control->process}]. Status: {$validated['status']}.",
            ]);
        });

        return response()->json([
            'data' => new ControlResource($control->fresh(['poTracking', 'photos'])),
            'message' => 'PO tracking updated successfully.',
        ]);
    }

    public function uploadPhoto(Request $request, Control $control, PhotoUploadService $photoUploadService): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'photo' => ['required', 'file', 'max:15360'], // 15MB max
        ]);

        try {
            $uploaded = $photoUploadService->uploadPhoto($request->file('photo'), 'process-photos');

            $photo = $control->photos()->create([
                'name' => $uploaded['original_name'] ?: $uploaded['name'],
                'path' => $uploaded['path'],
                'added_at' => Carbon::now(),
            ]);

            $item = $control->item;
            $joId = $item?->category?->jo_id;
            if ($joId) {
                Activity::create([
                    'jo_id' => $joId,
                    'message' => "Photo \"{$photo->name}\" added to \"{$item->description}\" [{$control->process}].",
                ]);
            }

            $url = Storage::disk('public')->url($photo->path);

            return response()->json([
                'data' => [
                    'id' => $photo->id,
                    'name' => $photo->name,
                    'previewUrl' => $url,
                    'addedAt' => $photo->added_at->toISOString(),
                ],
                'message' => 'Foto bukti proses berhasil diupload.',
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Gagal mengupload foto bukti: ' . $e->getMessage()], 500);
        }
    }

    public function deletePhoto(Request $request, ProcessPhoto $photo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($photo->path && Storage::disk('public')->exists($photo->path)) {
            Storage::disk('public')->delete($photo->path);
        }

        $photo->delete();

        return response()->json([
            'message' => 'Foto bukti proses berhasil dihapus.',
        ]);
    }
}
