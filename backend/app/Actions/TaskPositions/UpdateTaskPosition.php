<?php

namespace App\Actions\TaskPositions;

use App\Models\TaskPosition;
use Illuminate\Support\Facades\DB;

class UpdateTaskPosition
{
    public function execute(int $taskId, string|null $context, int|null $contextId = null, int $newPosition, int $organizationId, array $allTaskIds = []): array
    {
        //  Update task position within a context and return all affected tasks
        // Step 0: Ensure all tasks have positions
        if (!empty($allTaskIds)) {
            $this->ensureAllTasksHavePositions($context, $contextId, $organizationId, $allTaskIds);
        }

        $currentPosition = TaskPosition::where('task_id', $taskId)
            ->where('context', $context)
            ->where('context_id', $contextId)
            ->first();

        $oldPosition = $currentPosition?->position;

        // If position hasn't changed, return early
        if ($oldPosition === $newPosition && $currentPosition) {
            return [
                'primary' => $currentPosition,
                'affected' => collect(),
            ];
        }

        return DB::transaction(function () use ($taskId, $context, $contextId, $newPosition, $organizationId, $currentPosition, $oldPosition) {

            // Step 1: Temporarily move task out of range
            $tempPosition = -1 * time();
            if ($currentPosition) {
                $currentPosition->update(['position' => $tempPosition]);
            }

            // Step 2: Fetch all tasks in this context (ordered by position)
            $allPositions = TaskPosition::where('context', $context)
                ->where('context_id', $contextId)
                ->where('organization_id', $organizationId)
                ->where('task_id', '!=', $taskId)
                ->orderBy('position', 'ASC')
                ->get();

            $affectedTasks = collect();
            $actualNewPosition = $newPosition;

            if ($oldPosition === null) {
                // New position entry - add at end
                $lastPosition = $allPositions->max('position') ?? 0;
                $actualNewPosition = $lastPosition + 1;
            } else {
                // Reorder affected tasks based on movement direction
                if ($newPosition < $oldPosition) {
                    // Moving up: tasks between newPos and oldPos shift down
                    foreach ($allPositions as $pos) {
                        if ($pos->position >= $newPosition && $pos->position < $oldPosition) {
                            $pos->update(['position' => $pos->position + 1]);
                            $affectedTasks->push($pos);
                        }
                    }
                } elseif ($newPosition > $oldPosition) {
                    // Moving down: tasks between oldPos and newPos shift up
                    foreach ($allPositions as $pos) {
                        if ($pos->position > $oldPosition && $pos->position <= $newPosition) {
                            $pos->update(['position' => $pos->position - 1]);
                            $affectedTasks->push($pos);
                        }
                    }
                }
            }

            // Step 3: Create or update primary task position
            $primary = TaskPosition::updateOrCreate(
                [
                    'task_id' => $taskId,
                    'context' => $context,
                    'context_id' => $contextId,
                ],
                [
                    'position' => $actualNewPosition,
                    'organization_id' => $organizationId,
                ]
            );

            return [
                'primary' => $primary,
                'affected' => $affectedTasks,
            ];
        });
    }


    public function ensureAllTasksHavePositions(string|null $context, int|null $contextId, int $organizationId, array $allTaskIds): void
    {
        // Ensure all tasks in a context have positions (create if missing)
        // Get existing positions
        $existingPositions = TaskPosition::where('context', $context)
            ->where('context_id', $contextId)
            ->where('organization_id', $organizationId)
            ->pluck('task_id')
            ->toArray();

        // Find tasks without positions
        $missingTaskIds = array_diff($allTaskIds, $existingPositions);

        if (empty($missingTaskIds)) {
            return;
        }

        // Get max position
        $maxPosition = TaskPosition::where('context', $context)
            ->where('context_id', $contextId)
            ->where('organization_id', $organizationId)
            ->lockForUpdate()
            ->max('position') ?? 0;

        // Create positions for missing tasks in order they appear
        $position = $maxPosition;
        foreach ($missingTaskIds as $taskId) {
            $position++;
            TaskPosition::create([
                'task_id' => $taskId,
                'context' => $context,
                'context_id' => $contextId,
                'position' => $position,
                'organization_id' => $organizationId,
            ]);
        }
    }
}