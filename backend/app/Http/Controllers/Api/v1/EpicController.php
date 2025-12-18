<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEpicRequest;
use App\Http\Requests\UpdateEpicRequest;
use App\Http\Resources\EpicResource;
use App\Models\Epic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EpicController extends Controller
{
    protected Epic $epic;
    protected $userData;
    public function __construct(Epic $epic)
    {
        $this->epic = $epic;
        $this->userData = Auth::user();
    }
    public function index()
    {
        $epics = $this->epic->getEpics($this->userData->organization_id);
        $data = [
            "epics" => $epics,
        ];
        return apiResponse($data, 'Epics fetched successfully');
    }

    public function store(StoreEpicRequest $request)
    {
        // TODO: storeEpic model function
        $new = $this->epic->storeEpic($request, $this->userData);
        if ($new === "not found") {
            return apiResponse(null, 'Organization not found.', false, 404);
        }
        if (!$new) {
            return apiResponse(null, 'Epic creation failed', false, 404);
        }
        $data = [
            "epic" => new EpicResource($new['epic']),
        ];
        return apiResponse($data, 'Epic created successfully', true, 201);
    }

    public function show(Epic $epic)
    {
        // TODO: showEpic model function
        $details = $this->epic->showEpic($this->userData->organization_id, $epic->id);
        if (!$details) {
            return apiResponse(null, 'Epic not found', false, 404);
        }
        return apiResponse(new EpicResource($details), 'Epic details fetched successfully');
    }

    public function update(UpdateEpicRequest $request, Epic $epic)
    {
        // TODO: updateEpic model function
        $updated = $this->epic->updateEpic($request, $epic, $this->userData);
        if ($updated === "not found") {
            return apiResponse(null, 'Epic not found.', false, 404);
        }
        if (!$updated) {
            return apiResponse(null, 'Failed to update epic.', false, 500);
        }
        $epic->load(['status:id,name,color']);
        return apiResponse(new EpicResource($epic), 'Epic updated successfully');
    }

    public function destroy(Epic $epic)
    {
        // TODO: deleteEpic model function
        $result = $this->epic->deleteEpic($epic, $this->userData);
        if ($result === "not found") {
            return apiResponse(null, 'Epic not found.', false, 404);
        }
        if ($result === false) {
            return apiResponse(null, 'Epic cannot be deleted because they have assigned projects.', false, 400);
        }
        if ($result === null) {
            return apiResponse(null, 'Failed to delete epic.', false, 500);
        }
        return apiResponse('', 'Epic deleted successfully');
    }
}