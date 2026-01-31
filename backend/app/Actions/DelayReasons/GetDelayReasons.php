<?php

namespace App\Actions\DelayReasons;

use App\Models\DelayReason;
use Illuminate\Support\Collection;

class GetDelayReasons
{
    public function execute(int $organization_id): Collection
    {
        return DelayReason::forOrganization($organization_id)
            ->orderByDesc('id')
            ->get();
    }
}
