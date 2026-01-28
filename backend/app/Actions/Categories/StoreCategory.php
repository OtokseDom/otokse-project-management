<?php

namespace App\Actions\Categories;

use App\Models\Category;

class StoreCategory
{
    public function execute(array $data, int $userOrganizationId): Category|string|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        return Category::create($data);
    }
}
