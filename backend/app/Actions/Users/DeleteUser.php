<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class DeleteUser
{
    public function execute(User $user, int $userOrganizationId): bool|string|null
    {
        // Validate that the user belongs to user's organization
        if ($user->organization_id !== $userOrganizationId) {
            return "not found";
        }

        // Check if user has associated tasks
        if (DB::table('task_assignees')->where('assignee_id', $user->id)->exists()) {
            return false;
        }

        return $user->delete();
    }
}
