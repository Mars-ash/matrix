<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProjectController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $projects = Project::with([
            'jos.categories.items.controls.poTracking',
            'jos.categories.items.controls.photos',
            'jos.trialSessions.findings.entries.photos',
            'jos.activities',
        ])->oldest()->get();

        return ProjectResource::collection($projects);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $data = [
            'name' => $request->validated('name'),
            'customer' => $request->validated('customer'),
            'company' => $request->validated('company') ?: 'BKP',
        ];

        if ($request->filled('id')) {
            $data['id'] = $request->validated('id');
        }

        $project = Project::create($data);

        return response()->json([
            'data' => new ProjectResource($project->load('jos')),
            'message' => 'Project created successfully.',
        ], 201);
    }

    public function show(Project $project): ProjectResource
    {
        return new ProjectResource($project->load([
            'jos.categories.items.controls.poTracking',
            'jos.categories.items.controls.photos',
            'jos.trialSessions.findings.entries.photos',
            'jos.activities',
        ]));
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project->update($request->validated());

        return response()->json([
            'data' => new ProjectResource($project->load('jos')),
            'message' => 'Project updated successfully.',
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        if ($project->is_system) {
            return response()->json(['message' => 'System project cannot be deleted.'], 422);
        }

        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully.',
        ]);
    }
}
