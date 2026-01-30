<?php

namespace App\Http\Controllers\Api\v1;

use App\Actions\Projects\DeleteProject;
use App\Actions\projects\GetProjects;
use App\Actions\Projects\ShowProject;
use App\Actions\Projects\StoreProject;
use App\Actions\Projects\UpdateProject;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    protected Project $project;
    protected $userData;
    public function __construct(Project $project)
    {
        $this->project = $project;
        $this->userData = Auth::user();
    }
    public function index(GetProjects $getProjects)
    {
        $projects = $getProjects->execute($this->userData->organization_id);
        $kanbanColumns = $this->project->getKanbanColumns($this->userData->organization_id);
        $data = [
            "projects" => $projects,
            "kanbanColumns" => $kanbanColumns
        ];
        return apiResponse($data, 'Projects and Kanban Columns fetched successfully');
    }

    public function store(StoreProjectRequest $request, StoreProject $storeProject)
    {
        $new = $storeProject->execute($request->validated(), $this->userData->organization_id);
        if ($new === "not found") {
            return apiResponse(null, 'Organization not found.', false, 404);
        }
        if (!$new) {
            return apiResponse(null, 'Project creation failed', false, 404);
        }
        $data = [
            "project" => new ProjectResource($new['project']),
            "kanban" => $new['kanban']
        ];
        return apiResponse($data, 'Project created successfully', true, 201);
    }

    public function show(Project $project, ShowProject $showProject)
    {
        $details = $showProject->execute($project->id, $this->userData->organization_id);
        if (!$details) {
            return apiResponse(null, 'Project not found', false, 404);
        }
        return apiResponse(new ProjectResource($details), 'Project details fetched successfully');
    }

    public function update(UpdateProjectRequest $request, Project $project, UpdateProject $updateProject)
    {
        $updated = $updateProject->execute($project, $request->validated(), $this->userData->organization_id);
        if ($updated === "not found") {
            return apiResponse(null, 'Project not found.', false, 404);
        }
        if (!$updated) {
            return apiResponse(null, 'Failed to update project.', false, 500);
        }
        $project->load(['status:id,name,color']);
        return apiResponse(new ProjectResource($project), 'Project updated successfully');
    }

    public function destroy(Project $project, DeleteProject $deleteProject)
    {
        $result = $deleteProject->execute($project, $this->userData->organization_id);
        if ($result === "not found") {
            return apiResponse(null, 'Project not found.', false, 404);
        }
        if ($result === false) {
            return apiResponse(null, 'Project cannot be deleted because they have assigned tasks.', false, 400);
        }
        if ($result === null) {
            return apiResponse(null, 'Failed to delete project.', false, 500);
        }
        return apiResponse('', 'Project deleted successfully');
    }
}
