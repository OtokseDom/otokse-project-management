<?php

namespace App\Actions\Projects;

use App\Models\Project;

class UpdateProject
{
    public function execute(Project $project, array $data, int $userOrganizationId): Project|string|null
    {
        // Validate that the provided organization_id matches user's organization
        if ($data['organization_id'] !== $userOrganizationId) {
            return "not found";
        }

        $updated = $project->update($data);

        if (!$updated) {
            return null;
        }

        $project->load(['epic:id,title', 'status:id,name,color']);

        return $project;
    }
}
