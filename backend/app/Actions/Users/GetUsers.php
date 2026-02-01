<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Support\Collection;

class GetUsers
{
    public function execute(int $organization_id): Collection
    {
        return User::forOrganization($organization_id)
            ->orderByDesc('id')
            ->get();
    }
}
