<?php

namespace App\Services;

use App\Http\Resources\TaskResource;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RelationCheckerService
{
    protected Task $task;
    protected Project $project;
    protected $organization_id;
    public function __construct(Task $task, Project $project)
    {
        $this->task = $task;
        $this->project = $project;
        $this->organization_id = Auth::user()->organization_id;
    }
    public function checkTaskStatus($value)
    {
        return $this->task->where('status_id', $value)->where('organization_id', $this->organization_id)->exists();
    }

    public function checkTaskCategory($value)
    {
        return $this->task->where('category_id', $value)->where('organization_id', $this->organization_id)->exists();
    }

    public function checkTaskProject($value)
    {
        return $this->task->where('project_id', $value)->where('organization_id', $this->organization_id)->exists();
    }

    public function checkProjectEpic($value)
    {
        return $this->project->where('epic_id', $value)->where('organization_id', $this->organization_id)->exists();
    }

    public function checkTaskAssignee($value)
    {
        return DB::table('task_assignees')->where('assignee_id', $value)->exists();
    }
    public function checkTaskChildren($value)
    {
        return $this->task->where('id', $value)->where('organization_id', $this->organization_id)->whereHas('children')->exists();
    }
}
