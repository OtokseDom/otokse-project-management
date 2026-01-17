<?php

namespace App\Services;

use App\Models\Category;
use App\Models\DelayReason;
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

        // Delay Reasons
        $delayReasons = [
            // -------------------------
            // VALID / NEUTRAL REASONS
            // -------------------------
            [
                'organization_id' => $organizationId,
                'name' => 'Client Scope Change',
                'code' => 'CLIENT_SCOPE_CHANGE',
                'category' => 'scope',
                'impact_level' => 'neutral',
                'severity' => 3,
                'is_valid' => true,
                'description' => 'Delay caused by additional or changed client requirements.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Blocked by Dependency',
                'code' => 'DEPENDENCY_BLOCKED',
                'category' => 'dependency',
                'impact_level' => 'negative',
                'severity' => 4,
                'is_valid' => true,
                'description' => 'Task could not proceed due to dependency on another task or team.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'External System Issue',
                'code' => 'EXTERNAL_SYSTEM_ISSUE',
                'category' => 'external',
                'impact_level' => 'neutral',
                'severity' => 3,
                'is_valid' => true,
                'description' => 'Delay caused by third-party services or systems outside control.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // -------------------------
            // PROCESS / PLANNING ISSUES
            // -------------------------
            [
                'organization_id' => $organizationId,
                'name' => 'Poor Estimation',
                'code' => 'POOR_ESTIMATION',
                'category' => 'planning',
                'impact_level' => 'negative',
                'severity' => 4,
                'is_valid' => false,
                'description' => 'Original effort or timeline was underestimated.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Unclear Requirements',
                'code' => 'UNCLEAR_REQUIREMENTS',
                'category' => 'planning',
                'impact_level' => 'negative',
                'severity' => 4,
                'is_valid' => false,
                'description' => 'Requirements were incomplete or ambiguous at task start.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // -------------------------
            // RESOURCE ISSUES
            // -------------------------
            [
                'organization_id' => $organizationId,
                'name' => 'Resource Unavailable',
                'code' => 'RESOURCE_UNAVAILABLE',
                'category' => 'resource',
                'impact_level' => 'negative',
                'severity' => 3,
                'is_valid' => true,
                'description' => 'Assigned resource was unavailable due to leave or reassignment.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'organization_id' => $organizationId,
                'name' => 'Skill Gap Identified',
                'code' => 'SKILL_GAP',
                'category' => 'resource',
                'impact_level' => 'negative',
                'severity' => 3,
                'is_valid' => false,
                'description' => 'Task required skills not sufficiently available at the time.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // -------------------------
            // QUALITY / REWORK
            // -------------------------
            [
                'organization_id' => $organizationId,
                'name' => 'Rework Required',
                'code' => 'REWORK_REQUIRED',
                'category' => 'quality',
                'impact_level' => 'negative',
                'severity' => 4,
                'is_valid' => false,
                'description' => 'Task needed rework due to defects or quality issues.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],

            // -------------------------
            // POSITIVE / EDGE CASE
            // -------------------------
            [
                'organization_id' => $organizationId,
                'name' => 'Strategic Delay',
                'code' => 'STRATEGIC_DELAY',
                'category' => 'strategy',
                'impact_level' => 'positive',
                'severity' => 2,
                'is_valid' => true,
                'description' => 'Delay was intentional to align with broader strategy.',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DelayReason::insert($delayReasons);
    }
}
