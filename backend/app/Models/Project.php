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
        'epic_id',
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

    // Relationship with Epic
    public function epic()
    {
        return $this->belongsTo(Epic::class);
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

    public function scopeForOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }
}
