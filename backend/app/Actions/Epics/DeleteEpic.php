<?php

namespace App\Actions\Epics;

use App\Models\Epic;
use App\Models\Project;

class DeleteEpic
{
    public function execute(Epic $epic, int $userOrganizationId): string|bool|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($epic->organization_id !== $userOrganizationId) {
            return "not found";
        }
        if (Project::where('epic_id', $epic->id)->exists()) {
            return false;
        }

        return $epic->delete();
    }
}
