<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\TaskDiscussion;
use App\Http\Requests\StoreTaskDiscussionRequest;
use App\Http\Requests\UpdateTaskDiscussionRequest;
use App\Http\Resources\TaskDiscussionResource;
use Illuminate\Support\Facades\Auth;

class TaskDiscussionController extends Controller
{
    protected TaskDiscussion $taskDiscussion;
    protected $userData;

    public function __construct(TaskDiscussion $taskDiscussion)
    {
        $this->taskDiscussion = $taskDiscussion;
        $this->userData = Auth::user();
    }

    public function index()
    {
        $items = $this->taskDiscussion->getDiscussions($this->userData->organization_id);
        return apiResponse(TaskDiscussionResource::collection($items), 'Discussions fetched successfully');
    }

    public function store(StoreTaskDiscussionRequest $request)
    {
        $item = $this->taskDiscussion->storeDiscussion($request, $this->userData);
        if (!$item) {
            return apiResponse(null, 'Failed to create discussion', false, 500);
        }
        return apiResponse(new TaskDiscussionResource($item), 'Discussion created successfully', true, 201);
    }

    public function show(TaskDiscussion $taskDiscussion)
    {
        $details = $this->taskDiscussion->showDiscussion($taskDiscussion->id, $this->userData);
        if (!$details) {
            return apiResponse(null, 'Discussion not found', false, 404);
        }
        return apiResponse(new TaskDiscussionResource($details), 'Discussion details fetched successfully');
    }

    public function update(UpdateTaskDiscussionRequest $request, TaskDiscussion $taskDiscussion)
    {
        $updatedDiscussion = $this->taskDiscussion->updateDiscussion($request, $taskDiscussion, $this->userData);
        if (!$updatedDiscussion) {
            return apiResponse(null, 'Failed to update discussion', false, 500);
        }
        return apiResponse(new TaskDiscussionResource($updatedDiscussion), 'Discussion updated successfully');
    }


    public function destroy(TaskDiscussion $taskDiscussion)
    {
        $result = $this->taskDiscussion->deleteDiscussion($taskDiscussion, $this->userData);
        if ($result === false) {
            return apiResponse(null, 'Failed to delete discussion.', false, 500);
        }
        return apiResponse('', 'Discussion deleted successfully');
    }
}
