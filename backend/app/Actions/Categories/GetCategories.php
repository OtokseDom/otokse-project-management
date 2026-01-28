<?php

namespace App\Actions\Categories;

use App\Models\Category;
use Illuminate\Support\Collection;

class GetCategories
{
    public function execute(int $organization_id): Collection
    {
        return Category::forOrganization($organization_id)
            ->orderByDesc('id')
            ->get();
    }
}
