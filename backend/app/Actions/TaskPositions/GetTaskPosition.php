<?php

namespace App\Actions\TaskPositions;

use App\Models\TaskPosition;

class GetTaskPositions
{
    public function execute(int $taskId, string|null $context, int|null $contextId = null): TaskPosition|null
    {
        //  Get position for a task in a specific context
        return TaskPosition::where('task_id', $taskId)
            ->where('context', $context)
            ->where('context_id', $contextId)
            ->first();
    }
}