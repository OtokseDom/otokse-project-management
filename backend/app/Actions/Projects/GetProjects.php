<?php

namespace App\Actions\Projects;

use App\Models\Project;
use Illuminate\Support\Collection;

class GetProjects
{
    public function execute(int $organizationId): Collection
    {
        return Project::forOrganization($organizationId)
            ->with(['epic:id,title', 'status:id,name,color'])
            ->orderByDesc("id")
            ->get();
    }
}
