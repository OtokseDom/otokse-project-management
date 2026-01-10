<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            OrganizationSeeder::class,
            UserSeeder::class,
            TaskStatusSeeder::class,
            EpicSeeder::class,
            ProjectSeeder::class,
            CategorySeeder::class,
            TaskSeeder::class,
            TaskHistorySeeder::class,
            TaskAssigneeSeeder::class,
            KanbanColumnSeeder::class,
            DelayReasonSeeder::class,
        ]);
    }
}