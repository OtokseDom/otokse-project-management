<?php

namespace App\Actions\Projects;

use App\Models\KanbanColumn;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Facades\DB;

class DeleteProject
{
    public function execute(Project $project, int $userOrganizationId): string|bool|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($project->organization_id !== $userOrganizationId) {
            return "not found";
        }
        if (Task::where('project_id', $project->id)->exists()) {
            return false;
        }

        return DB::transaction(function () use ($project) {
            // Delete kanban columns linked to this project
            KanbanColumn::where('project_id', $project->id)->delete();

            // Delete the project itself
            if (!$project->delete()) {
                return null;
            }

            return true;
        });
    }
}
