<?php

namespace App\Http\Controllers\Api\v1;

use App\Actions\TaskPositions\GetContextPositions;
use App\Actions\TaskPositions\GetContextTaskIds;
use App\Actions\TaskPositions\UpdateTaskPosition;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTaskPositionRequest;
use App\Http\Resources\TaskPositionResource;
use Illuminate\Support\Facades\Auth;

class TaskPositionController extends Controller
{
    protected $userData;

    public function __construct()
    {
        $this->userData = Auth::user();
    }

    /**
     * Get positions for a specific context
     */
    public function getPositions(GetContextPositions $getContextPositions, $context, $contextId = null)
    {
        $positions = $getContextPositions->execute(
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
    public function update(GetContextTaskIds $getContextTaskIds, UpdateTaskPosition $updateTaskPosition, UpdateTaskPositionRequest $request)
    {
        $validated = $request->validated();

        // Get all task IDs for this context
        $allTaskIds = $getContextTaskIds->execute(
            $validated['context'],
            $validated['context_id'] ?? null,
            $this->userData->organization_id
        );

        $result = $updateTaskPosition->execute(
            $validated['task_id'],
            $validated['context'],
            $validated['context_id'] ?? null,
            $validated['position'],
            $this->userData->organization_id,
            $allTaskIds,
        );

        // Combine primary and affected tasks
        $allUpdated = collect([$result['primary']])->merge($result['affected']);

        return apiResponse(
            TaskPositionResource::collection($allUpdated),
            'Task position updated successfully.'
        );
    }
}