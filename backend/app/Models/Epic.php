<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

    /* -------------------------------------------------------------------------- */
    /*                          Controller Logic Function                         */
    /* -------------------------------------------------------------------------- */
    public function getEpics($organization_id)
    {
        return $this->with(['status:id,name,color', 'owner:id,name,email,role,position'])
            ->orderBy("id", "DESC")
            ->where('organization_id', $organization_id)
            ->get();
    }

    public function storeEpic($request, $userData)
    {
        if ($request->organization_id !== $userData->organization_id) {
            return "not found";
        }
        return DB::transaction(function () use ($request, $userData) {
            // Create the new epic
            $epicData = $request->validated();
            if (empty($epicData['slug'])) {
                $epicData['slug'] = $this->generateUniqueSlug($epicData['title'], $userData->organization_id);
            }
            $epic = $this->create($epicData);

            $epic->load(['status:id,name,color', 'owner:id,name,email,role,position']);

            $data = [
                "epic" => $epic,
            ];

            return $data;
        });
    }

    public function showEpic($organization_id, $epic_id)
    {
        return $this->with(['status:id,name,color', 'owner:id,name,email,role,position'])->where('id', $epic_id)
            ->where('organization_id', $organization_id)
            ->first();
    }

    public function updateEpic($request, $epic, $userData)
    {
        // Validate org_id param AND payload
        if ($epic->organization_id !== $userData->organization_id || $request->organization_id !== $userData->organization_id) {
            return "not found";
        }
        $updated = $epic->update($request->validated());
        if (!$updated) {
            return null;
        }
        $epic->load(['status:id,name,color', 'owner:id,name,email,role,position']);
        return $updated;
    }

    public function deleteEpic($epic, $userData)
    {
        if ($epic->organization_id !== $userData->organization_id) {
            return "not found";
        }
        if (Project::where('epic_id', $epic->id)->exists()) {
            return false;
        }

        return DB::transaction(function () use ($epic) {
            // TODO: Delete kanban columns linked to this status
            // KanbanColumn::where('epic_id', $epic->id)->delete();

            // Delete the epic itself
            if (!$epic->delete()) {
                return null;
            }

            return true;
        });
    }

    public function generateUniqueSlug($title, $organization_id)
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while ($this
            ->where('organization_id', $organization_id)
            ->where('slug', $slug)->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}