<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Epic extends Model
{
    use HasFactory;
    protected $fillable = [
        'organization_id',
        'status_id',
        'title',
        'owner_id',
        'slug',
        'description',
        'start_date',
        'end_date',
        'priority',
        'remarks'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    // Relationship with Organization
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    // Relationship with Epic
    public function epics()
    {
        return $this->hasMany(Epic::class, 'epic_id');
    }

    // Relationship with Status
    public function status()
    {
        return $this->belongsTo(TaskStatus::class);
    }

    // Relationship with Owner
    public function owner()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForOrganization($query, int $organization_id)
    {
        return $query->where('organization_id', $organization_id);
    }
}
