<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TaskPosition;
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

        $taskPosition = $this->taskPosition->updateTaskPosition(
            $validated['task_id'],
            $validated['context'],
            $validated['context_id'] ?? null,
            $validated['position'],
            $this->userData->organization_id
        );

        return apiResponse(
            new TaskPositionResource($taskPosition),
            'Task position updated successfully.'
        );
    }
}