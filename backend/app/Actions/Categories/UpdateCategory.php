<?php

namespace App\Actions\Categories;

use App\Models\Category;

class UpdateCategory
{
    public function execute(Category $category, array $data, int $userOrganizationId): bool|string|null
    {
        // Validate that both the category and request organization match user's organization
        if ($category->organization_id !== $userOrganizationId || $data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        return $category->update($data);
    }
}
