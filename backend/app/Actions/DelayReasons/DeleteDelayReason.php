<?php

namespace App\Actions\DelayReasons;

use App\Models\DelayReason;
use App\Models\Task;

class DeleteDelayReason
{
    public function execute(DelayReason $delayReason, int $userOrganizationId): bool|string|null
    {
        // Validate that the delayReason belongs to user's organization
        if ($delayReason->organization_id !== $userOrganizationId) {
            return "not found";
        }

        // Check if delayReason has associated tasks
        if (Task::where('delay_reason_id', $delayReason->id)->exists()) {
            return false;
        }

        return $delayReason->delete();
    }
}
