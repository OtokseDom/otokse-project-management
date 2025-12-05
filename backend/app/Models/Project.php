<?php

namespace App\Models;

use App\Http\Resources\ProjectResource;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id',
        'status_id',
        'title',
        'description',
        // 'target_date',
        // 'estimated_date',
        'start_date',
        'end_date',
        'actual_date',
        'days_estimate',
        'days_taken',
        'delay_days',
        'delay_reason',
        'priority',
        'remarks'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'actual_date' => 'date',
    ];

    // Relationship with Organization
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    // Relationship with Task
    public function tasks()
    {
        return $this->hasMany(Task::class, 'project_id');
    }

    // Relationship with Status
    public function status()
    {
        return $this->belongsTo(TaskStatus::class);
    }

    /* -------------------------------------------------------------------------- */
    /*                          Controller Logic Function                         */
    /* -------------------------------------------------------------------------- */
    public function getProjects($organization_id)
    {
        return $this->with('status:id,name,color')
            ->orderBy("id", "DESC")
            ->where('organization_id', $organization_id)
            ->get();
    }

    public function storeProject($request, $userData)
    {
        if ($request->organization_id !== $userData->organization_id) {
            return "not found";
        }

        return DB::transaction(function () use ($request, $userData) {
            // Create the new project
            $project = $this->create($request->validated());

            // Fetch all statuses for this organization
            $statuses = TaskStatus::where('organization_id', $userData->organization_id)->get();
            $kanbanColumns = [];

            foreach ($statuses as $key => $status) {
                $kanbanColumns[] = KanbanColumn::create([
                    'project_id'      => $project->id,
                    'task_status_id'       => $status->id,
                    'position'        => ++$key,
                    'organization_id' => $userData->organization_id,
                ]);
            }

            $project->load(['status:id,name,color']);

            $data = [
                "project" => $project,
                "kanban" => $kanbanColumns,
            ];
            return $data;
        });
    }

    public function showProject($organization_id, $project_id)
    {
        return $this->with('status:id,name,color')->where('id', $project_id)
            ->where('organization_id', $organization_id)
            ->first();
    }

    public function updateProject($request, $project, $userData)
    {
        // Validate org_id param AND payload
        if ($project->organization_id !== $userData->organization_id || $request->organization_id !== $userData->organization_id) {
            return "not found";
        }
        $updated = $project->update($request->validated());
        if (!$updated) {
            return null;
        }
        return $updated;
    }

    public function deleteProject($project, $userData)
    {
        if ($project->organization_id !== $userData->organization_id) {
            return "not found";
        }
        if (Task::where('project_id', $project->id)->exists()) {
            return false;
        }

        return DB::transaction(function () use ($project) {
            // Delete kanban columns linked to this status
            KanbanColumn::where('project_id', $project->id)->delete();

            // Delete the project itself
            if (!$project->delete()) {
                return null;
            }

            return true;
        });
    }

    public function getKanbanColumns($organization_id)
    {
        return KanbanColumn::where('organization_id', $organization_id)->orderBy("id", "DESC")->get();
    }
}