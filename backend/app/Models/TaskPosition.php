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
     * Update task position within a context
     */
    public function updateTaskPosition($taskId, $context, $contextId = null, $newPosition, $organizationId)
    {
        $currentPosition = self::where('task_id', $taskId)
            ->where('context', $context)
            ->where('context_id', $contextId)
            ->first();

        return DB::transaction(function () use ($taskId, $context, $contextId, $newPosition, $organizationId, $currentPosition) {
            $oldPosition = $currentPosition?->position;

            // If position hasn't changed, return early
            if ($oldPosition === $newPosition && $currentPosition) {
                return $currentPosition;
            }

            // Step 0: Temporarily move task out of range
            $tempPosition = -1 * time();
            if ($currentPosition) {
                $currentPosition->update(['position' => $tempPosition]);
            }

            if ($oldPosition === null) {
                // New position entry - find last position in context
                $lastPosition = self::where('context', $context)
                    ->where('context_id', $contextId)
                    ->where('organization_id', $organizationId)
                    ->max('position') ?? 0;
                $newPosition = $lastPosition + 1;
            } else {
                // Reorder affected tasks
                if ($newPosition < $oldPosition) {
                    // Moving up
                    $affected = self::where('context', $context)
                        ->where('context_id', $contextId)
                        ->where('organization_id', $organizationId)
                        ->whereBetween('position', [$newPosition, $oldPosition - 1])
                        ->orderBy('position', 'ASC')
                        ->get();

                    foreach ($affected as $t) {
                        $t->update(['position' => $t->position + 1000000]);
                    }

                    foreach ($affected as $i => $t) {
                        $t->update(['position' => $newPosition + 1 + $i]);
                    }
                } elseif ($newPosition > $oldPosition) {
                    // Moving down
                    $affected = self::where('context', $context)
                        ->where('context_id', $contextId)
                        ->where('organization_id', $organizationId)
                        ->whereBetween('position', [$oldPosition + 1, $newPosition])
                        ->orderBy('position', 'DESC')
                        ->get();

                    foreach ($affected as $t) {
                        $t->update(['position' => $t->position - 1000000]);
                    }

                    foreach ($affected as $i => $t) {
                        $t->update(['position' => $newPosition - 1 - $i]);
                    }
                }
            }

            // Create or update position record
            return self::updateOrCreate(
                [
                    'task_id' => $taskId,
                    'context' => $context,
                    'context_id' => $contextId,
                ],
                [
                    'position' => $newPosition,
                    'organization_id' => $organizationId,
                ]
            );
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
     * Reorder tasks when deleting
     */
    public function cleanupPositionsAfterDelete($taskId, $context, $contextId, $organizationId, $oldPosition)
    {
        self::where('context', $context)
            ->where('context_id', $contextId)
            ->where('organization_id', $organizationId)
            ->where('position', '>', $oldPosition)
            ->update([
                'position' => DB::raw("position - 1")
            ]);
    }
}