<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DelayReasonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('delay_reasons')->insert([
            // -------------------------
            // VALID / NEUTRAL REASONS
            // -------------------------
            [
                'organization_id' => 1,
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
                'organization_id' => 1,
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
                'organization_id' => 1,
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
                'organization_id' => 1,
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
                'organization_id' => 1,
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
                'organization_id' => 1,
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
                'organization_id' => 1,
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
                'organization_id' => 1,
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
                'organization_id' => 1,
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
        ]);
    }
}
