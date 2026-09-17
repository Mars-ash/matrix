<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
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
        ]));
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully.',
        ]);
    }
}
