<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TrialEntryPhotoResource;
use App\Http\Resources\TrialSessionResource;
use App\Models\Activity;
use App\Models\JO;
use App\Models\TrialEntry;
use App\Models\TrialEntryPhoto;
use App\Models\TrialFinding;
use App\Models\TrialSession;
use App\Services\PhotoUploadService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TrialSessionController extends Controller
{
    public function __construct(private readonly PhotoUploadService $photoService)
    {
    }

    public function index(JO $jo): JsonResponse
    {
        $sessions = $jo->trialSessions()
            ->with(['findings.entries.photos'])
            ->latest('trial_date')
            ->get();

        return response()->json([
            'data' => TrialSessionResource::collection($sessions),
        ]);
    }

    public function show(TrialSession $session): JsonResponse
    {
        return response()->json([
            'data' => new TrialSessionResource($session->load(['findings.entries.photos'])),
        ]);
    }

    public function store(Request $request, JO $jo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trialDate' => ['nullable', 'date'],
            'updateDate' => ['nullable', 'date'],
            'customer' => ['nullable', 'string', 'max:255'],
            'jobNo' => ['nullable', 'string', 'max:255'],
            'picName' => ['nullable', 'string', 'max:255'],
            'approvedByName' => ['nullable', 'string', 'max:255'],
        ]);

        $session = DB::transaction(function () use ($validated, $jo) {
            $nowDate = Carbon::now()->format('Y-m-d');

            $session = $jo->trialSessions()->create([
                'name' => $validated['name'],
                'trial_date' => $validated['trialDate'] ?? $nowDate,
                'update_date' => $validated['updateDate'] ?? $nowDate,
                'customer' => $validated['customer'] ?? ($jo->project?->customer ?? ''),
                'job_no' => $validated['jobNo'] ?? $jo->jo_number,
                'pic_name' => $validated['picName'] ?? '',
                'approved_by_name' => $validated['approvedByName'] ?? '',
            ]);

            // Create initial finding with blank problem, cause, corrective action
            $finding = $session->findings()->create(['order' => 1]);
            $finding->entries()->create(['section' => 'problems', 'order' => 1, 'text' => '']);
            $finding->entries()->create(['section' => 'causes', 'order' => 1, 'text' => '']);
            $finding->entries()->create([
                'section' => 'correctiveActions',
                'order' => 1,
                'text' => '',
                'target_date' => $nowDate,
                'pic' => '',
                'status' => 'On Process',
            ]);

            Activity::create([
                'jo_id' => $jo->id,
                'message' => "Trial Session \"{$session->name}\" created.",
            ]);

            return $session;
        });

        return response()->json([
            'data' => new TrialSessionResource($session->load(['findings.entries.photos'])),
            'message' => 'Trial Session created successfully.',
        ], 201);
    }

    public function update(Request $request, TrialSession $session): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'trialDate' => ['nullable', 'date'],
            'updateDate' => ['nullable', 'date'],
            'customer' => ['nullable', 'string', 'max:255'],
            'jobNo' => ['nullable', 'string', 'max:255'],
            'picName' => ['nullable', 'string', 'max:255'],
            'approvedByName' => ['nullable', 'string', 'max:255'],
        ]);

        $updateData = [];
        if (isset($validated['name'])) $updateData['name'] = $validated['name'];
        if (isset($validated['trialDate'])) $updateData['trial_date'] = $validated['trialDate'];
        if (isset($validated['updateDate'])) $updateData['update_date'] = $validated['updateDate'];
        if (isset($validated['customer'])) $updateData['customer'] = $validated['customer'];
        if (isset($validated['jobNo'])) $updateData['job_no'] = $validated['jobNo'];
        if (isset($validated['picName'])) $updateData['pic_name'] = $validated['picName'];
        if (isset($validated['approvedByName'])) $updateData['approved_by_name'] = $validated['approvedByName'];

        $session->update($updateData);

        return response()->json([
            'data' => new TrialSessionResource($session->load(['findings.entries.photos'])),
            'message' => 'Trial Session updated successfully.',
        ]);
    }

    public function duplicate(Request $request, TrialSession $session): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $newSession = DB::transaction(function () use ($validated, $session) {
            $newName = $validated['name'] ?? ($session->name . ' (Copy)');
            $nowDate = Carbon::now()->format('Y-m-d');

            $copy = $session->replicate(['id', 'created_at', 'updated_at']);
            $copy->id = (string) Str::uuid();
            $copy->name = $newName;
            $copy->update_date = $nowDate;
            $copy->save();

            // Deep clone findings, entries, and photo references
            foreach ($session->findings()->with('entries.photos')->get() as $finding) {
                $newFinding = $finding->replicate(['id', 'created_at', 'updated_at']);
                $newFinding->id = (string) Str::uuid();
                $newFinding->trial_session_id = $copy->id;
                $newFinding->save();

                foreach ($finding->entries as $entry) {
                    $newEntry = $entry->replicate(['id', 'created_at', 'updated_at']);
                    $newEntry->id = (string) Str::uuid();
                    $newEntry->trial_finding_id = $newFinding->id;
                    $newEntry->save();

                    foreach ($entry->photos as $photo) {
                        $newPhoto = $photo->replicate(['id', 'created_at', 'updated_at']);
                        $newPhoto->id = (string) Str::uuid();
                        $newPhoto->trial_entry_id = $newEntry->id;
                        $newPhoto->save();
                    }
                }
            }

            Activity::create([
                'jo_id' => $session->jo_id,
                'message' => "Trial Session duplicated: \"{$session->name}\" → \"{$copy->name}\".",
            ]);

            return $copy;
        });

        return response()->json([
            'data' => new TrialSessionResource($newSession->load(['findings.entries.photos'])),
            'message' => 'Trial Session duplicated successfully.',
        ], 201);
    }

    public function destroy(Request $request, TrialSession $session): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $name = $session->name;
        $joId = $session->jo_id;
        $session->delete();

        Activity::create([
            'jo_id' => $joId,
            'message' => "Trial Session \"{$name}\" deleted.",
        ]);

        return response()->json(['message' => 'Trial Session deleted successfully.']);
    }

    public function addFinding(Request $request, TrialSession $session): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $nowDate = Carbon::now()->format('Y-m-d');
        $maxOrder = $session->findings()->max('order') ?? 0;

        $finding = DB::transaction(function () use ($session, $maxOrder, $nowDate) {
            $finding = $session->findings()->create([
                'order' => $maxOrder + 1,
            ]);

            $finding->entries()->create(['section' => 'problems', 'order' => 1, 'text' => '']);
            $finding->entries()->create(['section' => 'causes', 'order' => 1, 'text' => '']);
            $finding->entries()->create([
                'section' => 'correctiveActions',
                'order' => 1,
                'text' => '',
                'target_date' => $nowDate,
                'pic' => '',
                'status' => 'On Process',
            ]);

            return $finding;
        });

        return response()->json([
            'data' => new TrialSessionResource($session->fresh(['findings.entries.photos'])),
            'message' => 'Finding added successfully.',
        ], 201);
    }

    public function deleteFinding(Request $request, TrialFinding $finding): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $session = $finding->session;
        $finding->delete();

        return response()->json([
            'data' => new TrialSessionResource($session->fresh(['findings.entries.photos'])),
            'message' => 'Finding deleted successfully.',
        ]);
    }

    public function addEntry(Request $request, TrialFinding $finding): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'section' => ['required', 'in:problems,causes,correctiveActions'],
            'text' => ['nullable', 'string'],
            'targetDate' => ['nullable', 'date'],
            'pic' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:On Process,Close'],
        ]);

        $maxOrder = $finding->entries()->where('section', $validated['section'])->max('order') ?? 0;

        $entry = $finding->entries()->create([
            'section' => $validated['section'],
            'order' => $maxOrder + 1,
            'text' => $validated['text'] ?? '',
            'target_date' => $validated['targetDate'] ?? null,
            'pic' => $validated['pic'] ?? null,
            'status' => $validated['status'] ?? ($validated['section'] === 'correctiveActions' ? 'On Process' : null),
        ]);

        return response()->json([
            'data' => new TrialSessionResource($finding->session->fresh(['findings.entries.photos'])),
            'message' => 'Entry added successfully.',
        ], 201);
    }

    public function updateEntry(Request $request, TrialEntry $entry): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'text' => ['nullable', 'string'],
            'targetDate' => ['nullable', 'date'],
            'pic' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'in:On Process,Close'],
        ]);

        $updateData = [];
        if (array_key_exists('text', $validated)) $updateData['text'] = $validated['text'] ?? '';
        if (array_key_exists('targetDate', $validated)) $updateData['target_date'] = $validated['targetDate'];
        if (array_key_exists('pic', $validated)) $updateData['pic'] = $validated['pic'];
        if (array_key_exists('status', $validated)) $updateData['status'] = $validated['status'];

        $entry->update($updateData);

        return response()->json([
            'data' => new TrialSessionResource($entry->finding->session->fresh(['findings.entries.photos'])),
            'message' => 'Entry updated successfully.',
        ]);
    }

    public function deleteEntry(Request $request, TrialEntry $entry): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $session = $entry->finding->session;
        $entry->delete();

        return response()->json([
            'data' => new TrialSessionResource($session->fresh(['findings.entries.photos'])),
            'message' => 'Entry deleted successfully.',
        ]);
    }

    public function uploadPhoto(Request $request, TrialEntry $entry): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->validate([
            'photo' => ['required', 'file', 'max:5120'], // 5MB
        ]);

        $uploaded = $this->photoService->uploadPhoto($request->file('photo'));

        $photo = $entry->photos()->create([
            'name' => $uploaded['original_name'] ?: $uploaded['name'],
            'path' => $uploaded['path'],
            'added_at' => Carbon::now(),
        ]);

        return response()->json([
            'data' => new TrialEntryPhotoResource($photo),
            'session' => new TrialSessionResource($entry->finding->session->fresh(['findings.entries.photos'])),
            'message' => 'Photo uploaded successfully.',
        ], 201);
    }

    public function deletePhoto(Request $request, TrialEntryPhoto $photo): JsonResponse
    {
        if (!$request->user()?->isController()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $session = $photo->entry->finding->session;

        // Delete from public storage if exists
        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json([
            'data' => new TrialSessionResource($session->fresh(['findings.entries.photos'])),
            'message' => 'Photo removed successfully.',
        ]);
    }
}
