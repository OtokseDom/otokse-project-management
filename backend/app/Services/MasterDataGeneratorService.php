<?php

namespace App\Services;

use App\Models\Category;
use App\Models\TaskStatus;
use Carbon\Carbon;

class MasterDataGeneratorService
{
    public static function generate($organizationId)
    {
        $now = Carbon::now();
        $categories = [
            [
                'organization_id' => $organizationId,
                'name' => 'Bug Fix',
                'description' => 'Fix found bugs in the application',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Feature',
                'description' => 'Develop or enhance application features',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Documentation',
                'description' => 'Write or update technical/user documentation',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Maintenance',
                'description' => 'Refactor, update libraries, or general upkeep',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Testing & QA',
                'description' => 'Manual or automated testing and quality checks',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Other',
                'description' => 'Miscellaneous or uncategorized tasks',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];


        Category::insert($categories);

        // Status

        $statuses = [
            [
                'organization_id' => $organizationId,
                'name' => 'Pending',
                'description' => 'To do tasks that are yet to be started',
                'color' => 'yellow',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'In Progress',
                'description' => 'Tasks that are currently being worked on',
                'color' => 'blue',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'For Review',
                'description' => 'Tasks that are completed and awaiting review',
                'color' => 'orange',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Completed',
                'description' => 'Tasks that have been finished',
                'color' => 'green',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Delayed',
                'description' => 'Tasks that are behind schedule',
                'color' => 'purple',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'On Hold',
                'description' => 'Tasks that are temporarily paused',
                'color' => 'gray',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Cancelled',
                'description' => 'Tasks that have been cancelled and will not be completed',
                'color' => 'red',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        TaskStatus::insert($statuses);

        // TOOD: Feat - ❗Urgent - Populate delay reasons
    }
}
