<?php

namespace App\Actions\Epics;

use App\Models\Epic;
use Illuminate\Support\Collection;

class GetEpics
{
    public function execute(int $organizationId): Collection
    {
        return Epic::forOrganization($organizationId)
            ->with(['status:id,name,color', 'owner:id,name,email,role,position'])
            ->orderByDesc('id')
            ->get();
    }
}
