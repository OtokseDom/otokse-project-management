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
     * Ensure all tasks in a context have positions (create if missing)
     */
    public function ensureAllTasksHavePositions($context, $contextId, $organizationId, $allTaskIds)
    {
        // Get existing positions
        $existingPositions = self::where('context', $context)
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
        $maxPosition = self::where('context', $context)
            ->where('context_id', $contextId)
            ->where('organization_id', $organizationId)
            ->lockForUpdate()
            ->max('position') ?? 0;

        // Create positions for missing tasks in order they appear
        $position = $maxPosition;
        foreach ($missingTaskIds as $taskId) {
            $position++;
            self::create([
                'task_id' => $taskId,
                'context' => $context,
                'context_id' => $contextId,
                'position' => $position,
                'organization_id' => $organizationId,
            ]);
        }
    }

    /**
     * Update task position within a context and return all affected tasks
     */
    public function updateTaskPosition($taskId, $context, $contextId = null, $newPosition, $organizationId, $allTaskIds = [])
    {
        // Step 0: Ensure all tasks have positions
        if (!empty($allTaskIds)) {
            $this->ensureAllTasksHavePositions($context, $contextId, $organizationId, $allTaskIds);
        }

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

            // Step 1: Temporarily move task out of range
            $tempPosition = -1 * time();
            if ($currentPosition) {
                $currentPosition->update(['position' => $tempPosition]);
            }

            // Step 2: Fetch all tasks in this context (ordered by position)
            $allPositions = self::where('context', $context)
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

    // New: add a position entry for a newly created task across all contexts
    /**
     * Create position entries for a new task across all contexts (or for provided contexts).
     *
     * @param int $taskId
     * @param int $organizationId
     * @param array|null $contexts Optional array of ['context' => string, 'context_id' => mixed] pairs.
     *                              If null, distinct contexts for the organization will be derived
     *                              from existing TaskPosition rows.
     * @return bool true on success (no-op if no contexts found)
     */
    public function addNewTaskToAllContexts($taskId, $organizationId, $contexts = null)
    {
        return DB::transaction(function () use ($taskId, $organizationId, $contexts) {
            // If specific contexts provided, use them
            if (is_array($contexts) && count($contexts) > 0) {
                $pairs = $contexts;
            } else {
                // Derive distinct context / context_id pairs already present for this organization
                $pairs = self::where('organization_id', $organizationId)
                    ->select('context', 'context_id')
                    ->distinct()
                    ->get()
                    ->map(function ($r) {
                        return ['context' => $r->context, 'context_id' => $r->context_id];
                    })
                    ->toArray();
            }

            // If nothing to insert into, do nothing (caller can pass contexts explicitly)
            if (empty($pairs)) {
                return true;
            }

            foreach ($pairs as $p) {
                // If a position entry already exists for this task in this context, skip it.
                $existing = self::where('task_id', $taskId)
                    ->where('context', $p['context'])
                    ->where('context_id', $p['context_id'])
                    ->where('organization_id', $organizationId)
                    ->first();

                if ($existing) {
                    // Ensure position is set (if missing) — compute max and update if necessary
                    if (empty($existing->position)) {
                        $maxPosition = self::where('context', $p['context'])
                            ->where('context_id', $p['context_id'])
                            ->where('organization_id', $organizationId)
                            ->lockForUpdate()
                            ->max('position') ?? 0;
                        $existing->position = $maxPosition + 1;
                        $existing->save();
                    }
                    continue;
                }

                // Compute next position with a lock to avoid races
                $maxPosition = self::where('context', $p['context'])
                    ->where('context_id', $p['context_id'])
                    ->where('organization_id', $organizationId)
                    ->lockForUpdate()
                    ->max('position') ?? 0;

                $position = $maxPosition + 1;

                try {
                    // Use updateOrCreate to be safe if another process created it between the check and insert
                    self::updateOrCreate(
                        [
                            'task_id' => $taskId,
                            'context' => $p['context'],
                            'context_id' => $p['context_id'],
                            'organization_id' => $organizationId,
                        ],
                        [
                            'position' => $position,
                        ]
                    );
                } catch (\Illuminate\Database\QueryException $e) {
                    // If duplicate key race occurs, ignore and continue — the entry exists now.
                    if ($e->getCode() === '23000') {
                        // no-op
                    } else {
                        throw $e;
                    }
                }
            }

            return true;
        });
    }
}