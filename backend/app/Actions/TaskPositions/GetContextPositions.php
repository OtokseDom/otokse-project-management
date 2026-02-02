<?php

namespace App\Actions\TaskPositions;

use App\Models\TaskPosition;
use Illuminate\Support\Collection;

class GetContextPositions
{
    public function execute(string|null $context, int|null $contextId = null, int $organizationId): Collection|null
    {
        //  Get all positions for a context
        return TaskPosition::where('context', $context)
            ->where('context_id', $contextId)
            ->where('organization_id', $organizationId)
            ->orderBy('position', 'ASC')
            ->get();
    }
}