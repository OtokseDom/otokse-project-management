<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $projects =
            [
                [
                    'organization_id' => 1,
                    'status_id' => 1,
                    'title' => 'Project Alpha',
                    'description' => 'Pioneer Project',
                    // 'target_date' => Carbon::parse('2025-08-12'),
                    // 'estimated_date' => Carbon::parse('2025-07-12'),
                    'start_date' => Carbon::parse('2025-08-12'),
                    'end_date' => Carbon::parse('2025-08-14'),
                    'actual_date' => Carbon::parse('2025-08-16'),
                    'days_estimate' => 3,
                    'days_taken' => 5,
                    'delay_days' => 2,
                    'delay_reason' => "Unexpected technical issues",
                    'priority' => 'Critical',
                    'remarks' => 'breaking changes'
                ],
                [
                    'organization_id' => 1,
                    'status_id' => 2,
                    'title' => 'Project Beta',
                    'description' => 'Pioneer Project',
                    // 'target_date' => Carbon::parse('2025-08-12'),
                    // 'estimated_date' => Carbon::parse('2025-07-12'),
                    'start_date' => Carbon::parse('2025-08-12'),
                    'end_date' => Carbon::parse('2025-08-14'),
                    'actual_date' => Carbon::parse('2025-08-16'),
                    'days_estimate' => 3,
                    'days_taken' => 5,
                    'delay_days' => 2,
                    'delay_reason' => "Unexpected technical issues",
                    'priority' => 'Medium',
                    'remarks' => 'Module adjustments'
                ],
                [
                    'organization_id' => 1,
                    'status_id' => 3,
                    'title' => 'Project Charlie',
                    'description' => 'Pioneer Project',
                    // 'target_date' => Carbon::parse('2025-08-12'),
                    // 'estimated_date' => Carbon::parse('2025-07-12'),
                    'start_date' => Carbon::parse('2025-08-12'),
                    'end_date' => Carbon::parse('2025-08-14'),
                    'actual_date' => Carbon::parse('2025-08-16'),
                    'days_estimate' => 3,
                    'days_taken' => 5,
                    'delay_days' => 2,
                    'delay_reason' => "Unexpected technical issues",
                    'priority' => 'Urgent',
                    'remarks' => 'Delayed due to feature creeps'
                ]
            ];

        foreach ($projects as $project) {
            Project::create($project);
        }
    }
}