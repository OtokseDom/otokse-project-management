<?php

namespace App\Actions\DelayReasons;

use App\Models\DelayReason;

class UpdateDelayReason
{
    public function execute(DelayReason $delayReason, array $data, int $userOrganizationId): bool|string|null
    {
        // Validate that both the delayReason and request organization match user's organization
        if ($delayReason->organization_id !== $userOrganizationId || $data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        return $delayReason->update($data);
    }
}
