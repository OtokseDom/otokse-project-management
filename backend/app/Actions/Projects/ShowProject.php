<?php

namespace App\Actions\Projects;

use App\Models\Project;

class ShowProject
{
    public function execute(int $projectId, int $organizationId): Project|null
    {
        return Project::forOrganization($organizationId)
            ->with(['epic:id,title', 'status:id,name,color'])
            ->where('id', $projectId)
            ->first();
    }
}
