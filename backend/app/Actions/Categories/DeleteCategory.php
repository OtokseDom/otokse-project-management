<?php

namespace App\Actions\Categories;

use App\Models\Category;
use App\Models\Task;

class DeleteCategory
{
    public function execute(Category $category, int $userOrganizationId): bool|string|null
    {
        // Validate that the category belongs to user's organization
        if ($category->organization_id !== $userOrganizationId) {
            return "not found";
        }

        // Check if category has associated tasks
        if (Task::where('category_id', $category->id)->exists()) {
            return false;
        }

        return $category->delete();
    }
}
