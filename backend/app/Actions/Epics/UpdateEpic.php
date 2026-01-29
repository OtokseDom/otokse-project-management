<?php

namespace App\Actions\Epics;

use App\Models\Epic;

class UpdateEpic
{
    public function execute(Epic $epic, array $data, int $userOrganizationId): Epic|string|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        $updated = $epic->update($data);

        if (!$updated) {
            return null;
        }

        $epic->load(['status:id,name,color', 'owner:id,name,email,role,position']);

        return $epic;
    }
}
