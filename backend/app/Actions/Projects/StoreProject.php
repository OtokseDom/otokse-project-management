<?php

namespace App\Actions\Projects;

use App\Models\KanbanColumn;
use App\Models\Project;
use App\Models\TaskStatus;
use Illuminate\Support\Facades\DB;

class StoreProject
{
    public function execute(array $data, int $userOrganizationId): string|array|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        return DB::transaction(function () use ($data, $userOrganizationId) {
            // Create the new project
            $project = Project::create($data);

            // Fetch all statuses for this organization
            $statuses = TaskStatus::where('organization_id', $userOrganizationId)->get();
            $kanbanColumns = [];

            foreach ($statuses as $key => $status) {
                $kanbanColumns[] = KanbanColumn::create([
                    'project_id'      => $project->id,
                    'task_status_id'       => $status->id,
                    'position'        => ++$key,
                    'organization_id' => $userOrganizationId,
                ]);
            }

            $project->load(['epic:id,title', 'status:id,name,color']);

            $data = [
                "project" => $project,
                "kanban" => $kanbanColumns,
            ];
            return $data;
        });
    }
}
