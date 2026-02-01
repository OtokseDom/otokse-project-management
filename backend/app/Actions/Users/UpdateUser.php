<?php

namespace App\Actions\Users;

use App\Models\User;

class UpdateUser
{
    public function execute(User $user, array $data, int $userOrganizationId): bool|string|null
    {
        // Validate that both the user and request organization match user's organization
        if ($user->organization_id !== $userOrganizationId || $data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        return $user->update($data);
    }
}
