<?php

namespace App\Actions\DelayReasons;

use App\Models\DelayReason;

class StoreDelayReason
{
    public function execute(array $data, int $userOrganizationId): DelayReason|string|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        return DelayReason::create($data);
    }
}
