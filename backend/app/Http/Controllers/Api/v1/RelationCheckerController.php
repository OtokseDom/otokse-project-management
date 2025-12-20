<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\RelationCheckerService;
use Illuminate\Http\Request;

class RelationCheckerController extends Controller
{
    protected RelationCheckerService $relationChecker;

    public function __construct(RelationCheckerService $relationChecker)
    {
        $this->relationChecker = $relationChecker;
    }

    public function check(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:status,category,project,epic,assignee,children',
            'value' => 'required|integer',
        ]);

        $type = $request->input('type');
        $value = $request->input('value');
        $method = "";
        if ($type === 'epic') {
            $method = "checkProject" . ucfirst($type);
        } else {
            $method = "checkTask" . ucfirst($type);
        }

        if (!method_exists($this->relationChecker, $method)) {
            return apiResponse(null, 'Invalid check type', false, 400);
        }

        $result = $this->relationChecker->$method($value);
        $data = [
            'type' => $type,
            'value' => $value,
            'exists' => $result,
        ];
        return apiResponse($data, "Data checked successfully", true);
    }
}
