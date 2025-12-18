<?php

namespace Database\Seeders;

use App\Models\Epic;
use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EpicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('epics')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $epics =
            [
                [
                    'organization_id' => 1,
                    'status_id' => 1,
                    'owner_id' => 1,
                    'slug' => 'epic-alpha',
                    'title' => 'Epic Alpha',
                    'description' => 'Pioneer Epic',
                    'start_date' => Carbon::parse('2025-08-12'),
                    'end_date' => Carbon::parse('2025-08-14'),
                    'priority' => 'Medium',
                    'remarks' => 'breaking changes'
                ],
                [
                    'organization_id' => 1,
                    'status_id' => 2,
                    'owner_id' => 1,
                    'slug' => 'epic-beta',
                    'title' => 'Epic Beta',
                    'description' => 'Pioneer Epic',
                    'start_date' => Carbon::parse('2025-08-12'),
                    'end_date' => Carbon::parse('2025-08-14'),
                    'priority' => 'Medium',
                    'remarks' => 'breaking changes'
                ],
                [
                    'organization_id' => 1,
                    'status_id' => 3,
                    'owner_id' => 1,
                    'slug' => 'epic-charlie',
                    'title' => 'Epic Charlie',
                    'description' => 'Pioneer Epic',
                    'start_date' => Carbon::parse('2025-08-12'),
                    'end_date' => Carbon::parse('2025-08-14'),
                    'priority' => 'Medium',
                    'remarks' => 'breaking changes'
                ]
            ];

        foreach ($epics as $epic) {
            Epic::create($epic);
        }
    }
}