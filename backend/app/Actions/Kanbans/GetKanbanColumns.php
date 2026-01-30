<?php

namespace App\Actions\Kanbans;

use App\Models\KanbanColumn;
use Illuminate\Support\Collection;

class GetKanbanColumns
{
    public function execute(int $organizationId): Collection
    {
        return KanbanColumn::where('organization_id', $organizationId)->orderBy("id", "DESC")->get();
    }
}
