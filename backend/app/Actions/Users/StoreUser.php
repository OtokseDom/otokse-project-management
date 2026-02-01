<?php

namespace App\Actions\Users;

use App\Models\User;

class StoreUser
{
    public function execute(array $data, int $userOrganizationId): User|string|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        return User::create($data);
    }
}
