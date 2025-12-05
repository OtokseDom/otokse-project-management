<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class TaskPosition extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'context',
        'context_id',
        'position',
        'organization_id',
    ];

    // Relationship with Task
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    /* -------------------------------------------------------------------------- */
    /*                          Controller Logic Functions                         */
    /* -------------------------------------------------------------------------- */

    /**
     * Get position for a task in a specific context
     */
    public function getTaskPosition($taskId, $context, $contextId = null)
    {
        return self::where('task_id', $taskId)
            ->where('context', $context)
            ->where('context_id', $contextId)
            ->first();
    }

    /**
     * Update task position within a context and return all affected tasks
     */
    public function updateTaskPosition($taskId, $context, $contextId = null, $newPosition, $organizationId)
    {
        $currentPosition = self::where('task_id', $taskId)
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

            // Step 0: Temporarily move task out of range
            $tempPosition = -1 * time();
            if ($currentPosition) {
                $currentPosition->update(['position' => $tempPosition]);
            }

            // Fetch all tasks in this context (ordered by position)
            $allPositions = self::where('context', $context)
                ->where('context_id', $contextId)
                ->where('organization_id', $organizationId)
                ->where('task_id', '!=', $taskId)
                ->orderBy('position', 'ASC')
                ->get();

            $affectedTasks = collect();

            if ($oldPosition === null) {
                // New position entry - add at end
                $lastPosition = $allPositions->max('position') ?? 0;
                $actualNewPosition = $lastPosition + 1;
            } else {
                // Reorder affected tasks
                $actualNewPosition = $newPosition;

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

            // Create or update primary task position
            $primary = self::updateOrCreate(
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

    /**
     * Get all positions for a context
     */
    public function getContextPositions($context, $contextId = null, $organizationId)
    {
        return self::where('context', $context)
            ->where('context_id', $contextId)
            ->where('organization_id', $organizationId)
            ->orderBy('position', 'ASC')
            ->get();
    }

    /**
     * Assign initial positions to unpositioned tasks in a context
     */
    public function assignInitialPositions($context, $contextId, $organizationId, $taskIds)
    {
        // Get max position for this context
        $maxPosition = self::where('context', $context)
            ->where('context_id', $contextId)
            ->where('organization_id', $organizationId)
            ->max('position') ?? 0;

        $unpositionedTasks = collect();
        $position = $maxPosition;

        // For each task that doesn't have a position, create one
        foreach ($taskIds as $taskId) {
            $exists = self::where('task_id', $taskId)
                ->where('context', $context)
                ->where('context_id', $contextId)
                ->exists();

            if (!$exists) {
                $position++;
                $taskPos = self::create([
                    'task_id' => $taskId,
                    'context' => $context,
                    'context_id' => $contextId,
                    'position' => $position,
                    'organization_id' => $organizationId,
                ]);
                $unpositionedTasks->push($taskPos);
            }
        }

        return $unpositionedTasks;
    }
}
