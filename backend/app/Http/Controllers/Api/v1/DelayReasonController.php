<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDelayReasonRequest;
use App\Http\Requests\UpdateDelayReasonRequest;
use App\Http\Resources\DelayReasonResource;
use App\Models\DelayReason;
use Illuminate\Support\Facades\Auth;

class DelayReasonController extends Controller
{
    protected DelayReason $delayReason;
    protected $userData;
    public function __construct(DelayReason $delayReason)
    {
        $this->delayReason = $delayReason;
        $this->userData = Auth::user();
    }

    public function index()
    {
        $categories = $this->delayReason->getCategories($this->userData->organization_id);
        return apiResponse($categories, 'Categories fetched successfully');
    }

    public function store(StoreDelayReasonRequest $request)
    {
        $delayReason = $this->delayReason->storeDelayReason($request, $this->userData);
        if ($delayReason === "not found") {
            return apiResponse(null, 'Organization not found.', false, 404);
        }
        if (!$delayReason) {
            return apiResponse(null, 'DelayReason creation failed', false, 404);
        }
        return apiResponse(new DelayReasonResource($delayReason), 'Delay reason created successfully', true, 201);
    }

    public function show(DelayReason $delayReason)
    {
        $details = $this->delayReason->showDelayReason($this->userData->organization_id, $delayReason->id);
        if (!$details) {
            return apiResponse(null, 'DelayReason not found', false, 404);
        }
        return apiResponse(new DelayReasonResource($details), 'Delay reason details fetched successfully');
    }

    public function update(UpdateDelayReasonRequest $request, DelayReason $delayReason)
    {
        $updated = $this->delayReason->updateDelayReason($request, $delayReason, $this->userData);
        if ($updated === "not found") {
            return apiResponse(null, 'Delay reason not found.', false, 404);
        }
        if (!$updated) {
            return apiResponse(null, 'Failed to update delay reason.', false, 500);
        }
        return apiResponse(new DelayReasonResource($delayReason), 'Delay reason updated successfully');
    }

    public function destroy(DelayReason $delayReason)
    {
        $result = $this->delayReason->deleteDelayReason($delayReason, $this->userData);
        if ($result === "not found") {
            return apiResponse(null, 'Delay reason not found.', false, 404);
        }
        if ($result === false) {
            return apiResponse(null, 'Delay reason cannot be deleted because they have assigned tasks.', false, 400);
        }
        if ($result === null) {
            return apiResponse(null, 'Failed to delete delay reason.', false, 500);
        }
        return apiResponse('', 'Delay reason deleted successfully');
    }
}
