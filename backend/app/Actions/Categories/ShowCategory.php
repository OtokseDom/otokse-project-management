<?php

namespace App\Actions\Categories;

use App\Models\Category;

class ShowCategory
{
    public function execute(int $categoryId, int $userOrganizationId): Category|null
    {
        return Category::forOrganization($userOrganizationId)
            ->where('id', $categoryId)
            ->first();
    }
}
