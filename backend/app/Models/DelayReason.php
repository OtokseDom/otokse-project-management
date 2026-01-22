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

    /* -------------------------------------------------------------------------- */
    /*                         Controller Logic Functions                         */
    /* -------------------------------------------------------------------------- */
    public function getDelayReasons($organization_id)
    {
        return $this->orderBy("id", "DESC")->where('organization_id', $organization_id)->get();
    }

    public function storeDelayReason($request, $userData)
    {
        if ($request->organization_id !== $userData->organization_id) {
            return "not found";
        }
        return $this->create($request->validated());
    }

    public function showDelayReason($organization_id, $delay_reason_id)
    {
        return $this->where('id', $delay_reason_id)
            ->where('organization_id', $organization_id)
            ->first();
    }

    public function updateDelayReason($request, $delayReason, $userData)
    {
        // Validate org_id param AND payload
        if ($delayReason->organization_id !== $userData->organization_id || $request->organization_id !== $userData->organization_id) {
            return "not found";
        }
        $updated = $delayReason->update($request->validated());
        if (!$updated) {
            return null;
        }
        return $updated;
    }

    public function deleteDelayReason($delayReason, $userData)
    {
        if ($delayReason->organization_id !== $userData->organization_id) {
            return "not found";
        }
        if (Task::where('delay_reason_id', $delayReason->id)->exists()) {
            return false;
        }
        if (!$delayReason->delete()) {
            return null;
        }
        return true;
    }
}