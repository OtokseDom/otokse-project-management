<?php

namespace App\Actions\Epics;

use App\Models\Epic;

class ShowEpic
{
    public function execute(int $epicId, int $organizationId): Epic|null
    {
        return Epic::forOrganization($organizationId)
            ->with(['status:id,name,color', 'owner:id,name,email,role,position'])
            ->where('id', $epicId)
            ->first();
    }
}
