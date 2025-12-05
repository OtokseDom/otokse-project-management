<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TaskPosition;
use App\Models\Task;
use App\Http\Requests\UpdateTaskPositionRequest;
use App\Http\Resources\TaskPositionResource;
use Illuminate\Support\Facades\Auth;

class TaskPositionController extends Controller
{
    protected TaskPosition $taskPosition;
    protected $userData;

    public function __construct(TaskPosition $taskPosition)
    {
        $this->taskPosition = $taskPosition;
        $this->userData = Auth::user();
    }

    /**
     * Get positions for a specific context
     */
    public function getPositions($context, $contextId = null)
    {
        $positions = $this->taskPosition->getContextPositions(
            $context,
            $contextId,
            $this->userData->organization_id
        );

        return apiResponse(
            TaskPositionResource::collection($positions),
            'Task positions retrieved successfully.'
        );
    }

    /**
     * Update task position
     */
    public function update(UpdateTaskPositionRequest $request)
    {
        $validated = $request->validated();

        // Get all task IDs for this context
        $allTaskIds = $this->getContextTaskIds(
            $validated['context'],
            $validated['context_id'] ?? null,
            $this->userData->organization_id
        );

        $result = $this->taskPosition->updateTaskPosition(
            $validated['task_id'],
            $validated['context'],
            $validated['context_id'] ?? null,
            $validated['position'],
            $this->userData->organization_id,
            $allTaskIds
        );

        // Combine primary and affected tasks
        $allUpdated = collect([$result['primary']])->merge($result['affected']);

        return apiResponse(
            TaskPositionResource::collection($allUpdated),
            'Task position updated successfully.'
        );
    }

    /**
     * Get all task IDs for a context (parent tasks only)
     */
    private function getContextTaskIds($context, $contextId, $organizationId)
    {
        $query = Task::where('organization_id', $organizationId)
            ->whereNull('parent_id'); // Only parent tasks

        if ($context === 'project' && $contextId) {
            $query->where('project_id', $contextId);
        }

        return $query->orderBy('id', 'ASC')->pluck('id')->toArray();
    }
}
