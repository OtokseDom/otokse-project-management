<?php

namespace App\Actions\TaskPositions;

use App\Models\TaskPosition;
use Illuminate\Support\Facades\DB;

class AddNewTaskToAllContexts
{
    public function execute(int $taskId, int $organizationId, string|null $contexts = null): bool
    {
        //  Create position entries for a new task across all contexts (or for provided contexts).
        return DB::transaction(function () use ($taskId, $organizationId, $contexts) {
            // If specific contexts provided, use them
            if (is_array($contexts) && count($contexts) > 0) {
                $pairs = $contexts;
            } else {
                // Derive distinct context / context_id pairs already present for this organization
                $pairs = TaskPosition::where('organization_id', $organizationId)
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
                $existing = TaskPosition::where('task_id', $taskId)
                    ->where('context', $p['context'])
                    ->where('context_id', $p['context_id'])
                    ->where('organization_id', $organizationId)
                    ->first();

                if ($existing) {
                    // Ensure position is set (if missing) — compute max and update if necessary
                    if (empty($existing->position)) {
                        $maxPosition = TaskPosition::where('context', $p['context'])
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
                $maxPosition = TaskPosition::where('context', $p['context'])
                    ->where('context_id', $p['context_id'])
                    ->where('organization_id', $organizationId)
                    ->lockForUpdate()
                    ->max('position') ?? 0;

                $position = $maxPosition + 1;

                try {
                    // Use updateOrCreate to be safe if another process created it between the check and insert
                    TaskPosition::updateOrCreate(
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