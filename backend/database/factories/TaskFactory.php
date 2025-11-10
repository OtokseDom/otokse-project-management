<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User;
use App\Models\Task;
use App\Models\TaskStatus;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    // static counters to track per (project_id, status_id)
    protected static array $positionCounters = [];
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
    {
        $statusId = TaskStatus::inRandomOrder()->value('id'); // still random, but we'll handle sequence
        $projectId = 1; // you can randomize later if needed

        // initialize counter for this project + status
        $key = $projectId . '-' . $statusId;
        if (!isset(self::$positionCounters[$key])) {
            self::$positionCounters[$key] = 1;
        } else {
            self::$positionCounters[$key]++;
        }
        return [
            'organization_id' => 1,
            'status_id' => $statusId,
            'project_id' => 1,
            'category_id' => Category::inRandomOrder()->value('id'),
            'title' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'expected_output' => $this->faker->sentence,
            'start_date' => $startDate = fake()->dateTimeBetween('now', '+1 month'),
            'end_date' => $startDate,
            'actual_date' => $startDate,
            'days_estimate' => $estimate = $this->faker->randomFloat(0, 1, 7),
            'days_taken' => $actual = $this->faker->randomFloat(0, 1, 7),
            'delay_days' => $estimate < $actual ? $actual - $estimate : 0,
            'start_time' => $this->faker->randomElement(['07:30:00', '08:00:00', '08:20:00', '09:45:00', '10:00:00']),
            'end_time' => $this->faker->randomElement(['13:30:00', '14:00:00', '15:45:00', '15:20:00', '16:00:00']),
            'actual_time' => $this->faker->randomElement(['13:30:00', '14:00:00', '15:45:00', '15:20:00', '16:00:00']),
            'time_estimate' => $this->faker->randomFloat(1, 1, 24),
            'time_taken' => $this->faker->randomFloat(1, 1, 36),
            'delay' => $this->faker->randomFloat(1, 0, 10),
            'delay_reason' => $this->faker->sentence,
            'performance_rating' => $this->faker->numberBetween(0, 5),
            'priority' => $this->faker->randomElement(['Low', 'Medium', 'High', 'Urgent', 'Critical']),
            'remarks' => $this->faker->paragraph,
            'position' => self::$positionCounters[$key],
        ];
    }
}
