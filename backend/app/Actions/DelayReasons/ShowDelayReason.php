<?php

namespace App\Actions\DelayReasons;

use App\Models\DelayReason;

class ShowDelayReason
{
    public function execute(int $delayReasonId, int $userOrganizationId): DelayReason|null
    {
        return DelayReason::forOrganization($userOrganizationId)
            ->where('id', $delayReasonId)
            ->first();
    }
}
