<?php

namespace App\Http\Controllers\Api\v1;

use App\Actions\Epics\DeleteEpic;
use App\Actions\Epics\GetEpics;
use App\Actions\Epics\ShowEpic;
use App\Actions\Epics\StoreEpic;
use App\Actions\Epics\UpdateEpic;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEpicRequest;
use App\Http\Requests\UpdateEpicRequest;
use App\Http\Resources\EpicResource;
use App\Models\Epic;
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
    public function index(GetEpics $getEpics)
    {
        $epics = $getEpics->execute($this->userData->organization_id);
        $data = [
            "epics" => $epics,
        ];
        return apiResponse($data, 'Epics fetched successfully');
    }

    public function store(StoreEpicRequest $request, StoreEpic $storeEpic)
    {
        $epic = $storeEpic->execute($request->validated(), $this->userData->organization_id);
        if ($epic === "not found") {
            return apiResponse(null, 'Organization not found.', false, 404);
        }
        if (!$epic) {
            return apiResponse(null, 'Epic creation failed', false, 404);
        }
        $data = [
            "epic" => new EpicResource($epic),
        ];
        return apiResponse($data, 'Epic created successfully', true, 201);
    }

    public function show(Epic $epic, ShowEpic $showEpic)
    {
        $details = $showEpic->execute($epic->id, $this->userData->organization_id);
        if (!$details) {
            return apiResponse(null, 'Epic not found', false, 404);
        }
        return apiResponse(new EpicResource($details), 'Epic details fetched successfully');
    }

    public function update(UpdateEpicRequest $request, Epic $epic, UpdateEpic $updateEpic)
    {
        $updated = $updateEpic->execute($epic, $request->validated(), $this->userData->organization_id);
        if ($updated === "not found") {
            return apiResponse(null, 'Epic not found.', false, 404);
        }
        if (!$updated) {
            return apiResponse(null, 'Failed to update epic.', false, 500);
        }

        return apiResponse(new EpicResource($updated), 'Epic updated successfully');
    }

    public function destroy(Epic $epic, DeleteEpic $deleteEpic)
    {
        $result = $deleteEpic->execute($epic, $this->userData->organization_id);
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
