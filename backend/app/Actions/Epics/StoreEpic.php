<?php

namespace App\Actions\Epics;

use App\Models\Epic;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StoreEpic
{
    public function execute(array $data, int $userOrganizationId): Epic|string|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        return DB::transaction(function () use ($data, $userOrganizationId) {
            // Create the new epic
            $epicData = $data;
            if (empty($epicData['slug'])) {
                $epicData['slug'] = $this->generateUniqueSlug($epicData['title'], $userOrganizationId);
            }
            $epic = Epic::create($epicData);

            $epic->load(['status:id,name,color', 'owner:id,name,email,role,position']);

            return $epic;
        });
    }

    public function generateUniqueSlug($title, $organizationId)
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 1;

        while (Epic::forOrganization($organizationId)
            ->where('organization_id', $organizationId)
            ->where('slug', $slug)->exists()
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
