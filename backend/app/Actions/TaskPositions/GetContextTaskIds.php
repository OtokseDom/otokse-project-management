<?php

namespace App\Actions\TaskPositions;

use App\Models\Task;

class GetContextTaskIds
{
    public function execute(string $context, int|null $contextId, int $organizationId): array|null
    {
        //  Get all task IDs for a context (parent tasks only)
        $query = Task::where('organization_id', $organizationId)
            ->whereNull('parent_id'); // Only parent tasks

        if ($context === 'project' && $contextId) {
            $query->where('project_id', $contextId);
        }

        return $query->orderBy('id', 'ASC')->pluck('id')->toArray();
    }
}