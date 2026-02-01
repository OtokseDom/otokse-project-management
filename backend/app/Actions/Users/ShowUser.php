<?php

namespace App\Actions\Users;

use App\Models\User;

class ShowUser
{
    public function execute(int $userId, int $userOrganizationId): User|null
    {
        return User::forOrganization($userOrganizationId)
            ->where('id', $userId)
            ->first();
    }
}
