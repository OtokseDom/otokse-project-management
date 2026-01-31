<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DelayReason extends Model
{
    use HasFactory;
    protected $fillable = [
        'organization_id',
        'name',
        'category',
        'impact_level',
        'severity',
        'is_valid',
        'description',
        'is_active',
    ];

    // Relationship with Organization
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function scopeForOrganization($query, $organization_id)
    {
        return $query->where('organization_id', $organization_id);
    }
}
