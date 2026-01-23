<?php

namespace App\Services;

use App\Http\Resources\TaskHistoryResource;
use App\Models\Category;
use App\Models\Task;
use App\Models\TaskHistory;
use App\Models\TaskStatus;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReportService
{
    protected Task $task;
    protected TaskHistory $task_history;
    protected TaskStatus $task_status;
    protected Category $category;
    protected User $user;
    protected $organization_id;
    /* -------------------------------------------------------------------------- */
    /*                                   HELPERS                                  */
    /* -------------------------------------------------------------------------- */
    public function __construct(Task $task, TaskHistory $task_history, TaskStatus $task_status, Category $category, User $user)
    {
        $this->task = $task;
        $this->task_history = $task_history;
        $this->task_status = $task_status;
        $this->category = $category;
        $this->user = $user;
        $this->organization_id = Auth::user()->organization_id;
    }

    // ---------------------- NEW HELPERS (AI-READY metadata + rules) ----------------------
    // 🧠 Build period & comparison_period dynamically based on provided filters or defaults
    private function buildPeriod($filter = null, $unit = null, $count = null)
    {
        // If explicit range provided use it and derive previous period of equal length
        if (!empty($filter['from']) && !empty($filter['to'])) {
            $from = Carbon::parse($filter['from'])->startOfDay();
            $to = Carbon::parse($filter['to'])->endOfDay();
            $length = $from->diffInSeconds($to);
            $prevTo = $from->copy()->subSecond();
            $prevFrom = $prevTo->copy()->subSeconds($length);
            return [
                'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                'comparison' => ['from' => $prevFrom->toDateString(), 'to' => $prevTo->toDateString()],
                'aggregation' => $unit ? ($unit === 'days' ? 'day' : ($unit === 'weeks' ? 'week' : 'month')) : null,
                'is_rolling' => true
            ];
        }
        // If defaults provided (e.g., last 7 days / 6 weeks / 6 months)
        if ($unit && $count) {
            $now = now();
            if ($unit === 'days') {
                $to = $now->endOfDay();
                $from = $now->copy()->subDays($count - 1)->startOfDay();
                $prevTo = $from->copy()->subSecond();
                $prevFrom = $prevTo->copy()->subDays($count - 1)->startOfDay();
                return [
                    'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                    'comparison' => ['from' => $prevFrom->toDateString(), 'to' => $prevTo->toDateString()],
                    'aggregation' => 'day',
                    'is_rolling' => true
                ];
            }
            if ($unit === 'weeks') {
                $to = $now->endOfDay();
                $from = $now->copy()->startOfWeek(Carbon::SUNDAY)->subWeeks($count - 1)->startOfDay();
                $prevTo = $from->copy()->subSecond();
                $prevFrom = $prevTo->copy()->startOfWeek(Carbon::SUNDAY)->subWeeks($count - 1)->startOfDay();
                return [
                    'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                    'comparison' => ['from' => $prevFrom->toDateString(), 'to' => $prevTo->toDateString()],
                    'aggregation' => 'week',
                    'is_rolling' => true
                ];
            }
            if ($unit === 'months') {
                $to = $now->endOfDay();
                $from = $now->copy()->startOfMonth()->subMonths($count - 1)->startOfDay();
                $prevTo = $from->copy()->subSecond();
                $prevFrom = $prevTo->copy()->startOfMonth()->subMonths($count - 1)->startOfDay();
                return [
                    'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
                    'comparison' => ['from' => $prevFrom->toDateString(), 'to' => $prevTo->toDateString()],
                    'aggregation' => 'month',
                    'is_rolling' => true
                ];
            }
        }
        // 🧠 All-time fallback (no fixed window)
        return [
            'period' => ['type' => 'all_time'],
            'comparison' => null,
            'aggregation' => null,
            'is_rolling' => false
        ];
    }

    // 📊 Parse filters into explicit structure for AI transparency
    private function parseFilters($filter = null)
    {
        if (!$filter || !is_array($filter)) {
            return [
                'users' => [],
                'projects' => [],
                'epics' => [],
                'raw' => null,
            ];
        }

        $normalizeList = function ($val) {
            if (is_array($val)) return array_values(array_filter($val, fn($v) => $v !== '' && $v !== null));
            if (is_string($val)) {
                $parts = array_values(array_filter(array_map('trim', explode(',', $val)), fn($v) => $v !== '' && $v !== null));
                // cast numeric strings to int when appropriate
                return array_map(function ($p) {
                    return is_numeric($p) ? (int)$p : $p;
                }, $parts);
            }
            return [];
        };

        return [
            'users' => $normalizeList($filter['users'] ?? null),
            'projects' => $normalizeList($filter['projects'] ?? null),
            'epics' => $normalizeList($filter['epics'] ?? null),
            'raw' => $filter,
        ];
    }

    // 🔍 Generate deterministic attention items per rule-set
    private function generateAttentionItems($reportKey, $data, $extra = [])
    {
        $items = [];

        // ✅ Tasks Completed rule (uses summary.current_total & previous_total when available)
        if ($reportKey === 'tasks_completed_last_7_days' || $reportKey === 'tasks_completed_last_6_weeks' || $reportKey === 'tasks_completed_last_6_months' || $reportKey === 'tasks_completed_per_user') {
            $curr = $data['summary']['current_total'] ?? null;
            $prev = $data['summary']['previous_total'] ?? null;
            if (!is_null($curr) && !is_null($prev) && $prev > 0) {
                if ($curr < $prev * 0.7) {
                    $drop = ($prev - $curr) / $prev;
                    $severity = $drop > 0.5 ? 'high' : 'medium';
                    $items[] = [
                        'generated_by' => 'rules',
                        'rule' => 'tasks_completed_drop',
                        'severity' => $severity,
                        'reason' => 'Task completion dropped significantly compared to the previous period.',
                        'current' => $curr,
                        'previous' => $prev,
                        'threshold' => [
                            'rule' => 'decrease_percentage',
                            'triggered_when' => 'current < previous * 0.7',
                            'actual_ratio' => $prev > 0 ? round($curr / $prev, 2) : null,
                        ],
                    ];
                }
            }
        }

        // ✅ Users Task Load rule
        if ($reportKey === 'users_task_load' && !empty($data['chart_data'])) {
            $counts = $data['chart_data']->pluck('task')->filter()->all();
            $avg = count($counts) ? array_sum($counts) / count($counts) : 0;
            foreach ($data['chart_data'] as $row) {
                $userTasks = $row->task ?? 0;
                if ($avg > 0 && $userTasks > $avg * 1.3) {
                    $ratio = $userTasks / $avg;
                    $severity = $ratio > 1.5 ? 'high' : 'medium';
                    $items[] = [
                        'generated_by' => 'rules',
                        'rule' => 'user_task_load',
                        'severity' => $severity,
                        'reason' => 'User workload significantly exceeds team average.',
                        'user' => $row->user ?? $row->name ?? null,
                        'user_tasks' => $userTasks,
                        'team_average' => round($avg, 2),
                        'threshold' => [
                            'rule' => 'above_team_average',
                            'triggered_when' => 'user_tasks > team_average * 1.3',
                            'actual_ratio' => $avg > 0 ? round($userTasks / $avg, 2) : null,
                        ]
                    ];
                }
            }
        }

        // ✅ Estimate vs Actual rule (overrun percent)
        if (($reportKey === 'estimate_vs_actual' || $reportKey === 'estimate_vs_actual_date') && isset($data['runs'])) {
            $over = abs($data['runs']['over'] ?? 0);
            $under = abs($data['runs']['under'] ?? 0);
            $total = $over + $under;
            if ($total > 0) {
                $over_pct = $over / $total;
                if ($over_pct > 0.2) {
                    $severity = $over_pct > 0.4 ? 'high' : 'medium';
                    $items[] = [
                        'generated_by' => 'rules',
                        'rule' => 'estimate_vs_actual_overrun',
                        'severity' => $severity,
                        'reason' => 'Actual effort consistently exceeds estimates.',
                        'overrun_percentage' => round($over_pct * 100, 2),
                        'threshold' => [
                            'rule' => 'overrun_ratio',
                            'triggered_when' => 'over / (over + under) > 0.2',
                            'actual_ratio' => round($over_pct, 2),
                        ]
                    ];
                }
            }
        }

        // ✅ Delay per user rule
        if ($reportKey === 'delay_per_user' && !empty($data['chart_data'])) {
            $delays = $data['chart_data']->pluck('delay')->map(fn($v) => (float)$v)->all();
            $avg = count($delays) ? array_sum($delays) / count($delays) : 0;
            foreach ($data['chart_data'] as $row) {
                $userDelay = (float)($row->delay ?? 0);
                if ($avg > 0 && $userDelay > $avg * 1.25) {
                    $severity = $userDelay > $avg * 1.5 ? 'high' : 'medium';
                    $items[] = [
                        'generated_by' => 'rules',
                        'rule' => 'delay_per_user',
                        'severity' => $severity,
                        'reason' => 'User has consistently higher delays than peers.',
                        'user' => $row->assignee ?? $row->assignee ?? null,
                        'user_delay' => $userDelay,
                        'team_average_delay' => round($avg, 2),
                        'threshold' => [
                            'rule' => 'delay_above_average',
                            'triggered_when' => 'user_delay > avg_delay * 1.25',
                            'actual_ratio' => $avg > 0 ? round($userDelay / $avg, 2) : null,
                        ]
                    ];
                }
            }
        }

        // ✅ Completion velocity rule
        if ($reportKey === 'completion_velocity' && isset($data['percentage_difference'])) {
            $eventPct = $data['percentage_difference']['value'] ?? 0;
            $isDecrease = ($data['percentage_difference']['event'] ?? '') === 'Decreased';
            if ($isDecrease && $eventPct > 20) {
                $severity = $eventPct > 40 ? 'high' : 'medium';
                $items[] = [
                    'generated_by' => 'rules',
                    'rule' => 'completion_velocity_decline',
                    'severity' => $severity,
                    'reason' => 'Completion velocity has declined compared to the previous period.',
                    'percentage_decrease' => $eventPct,
                    'threshold' => [
                        'rule' => 'velocity_decrease',
                        'triggered_when' => 'percentage_difference.value > 20 AND event == Decreased',
                        'actual_ratio' => $eventPct,
                    ]
                ];
            }
        }

        return [
            'generated_by' => 'rules',
            'items' => $items
        ];
    }

    // 🧠 Attach metadata (periods, filters, summary, aggregation, attention items)
    private function attachMetadata(array $data, $filter, $periodMeta, $current_total = null, $previous_total = null)
    {
        // 📊 Filters transparency for AI reasoning
        $data['filters_applied'] = $this->parseFilters($filter);

        // ⚠️ Period definitions required by AI
        $data['period'] = $periodMeta['period'] ?? ['type' => 'all_time'];
        $data['comparison_period'] = $periodMeta['comparison'] ?? null;

        // 🧠 Summary block (non-intrusive)
        // Prefer an explicit metric in payload (e.g. `progress`) when available
        $curr = null;
        if (isset($data['progress'])) {
            $curr = $data['progress'];
        } elseif (!is_null($current_total)) {
            $curr = $current_total;
        } elseif (isset($data['data_count'])) {
            $curr = $data['data_count'];
        }

        $prev = $previous_total;

        // Determine whether previous total was actually computed by the report
        if (isset($periodMeta['comparison']) && !is_null($periodMeta['comparison'])) {
            if (!is_null($prev)) {
                $previous_computed = true;
            } else {
                // comparison supported but previous_total not provided by report
                // default previous to 0 for safe downstream calculations, but mark as not computed
                $prev = 0;
                $previous_computed = false;
            }
        } else {
            // comparison not supported for this report
            $previous_computed = null;
            $prev = null;
        }

        $diff = !is_null($curr) && !is_null($prev) ? ($curr - $prev) : null;
        $pct = (!is_null($curr) && !is_null($prev) && $prev != 0) ? round((($curr - $prev) / $prev) * 100, 2) : null;

        // percentage_change_reason clarifies why percentage_change may be null
        $percentage_change_reason = null;
        if (is_null($pct)) {
            if (is_null($data['comparison_period'] ?? null)) {
                $percentage_change_reason = 'comparison_not_supported';
            } elseif ($previous_computed === false) {
                $percentage_change_reason = 'previous_not_computed';
            } elseif ($prev === 0) {
                $percentage_change_reason = 'previous_total_zero';
            } else {
                $percentage_change_reason = 'insufficient_data';
            }
        }

        // Add unit to summary to avoid ambiguous numeric interpretations
        $unit = 'count';
        $reportKey = $data['__report_key'] ?? null;
        if (in_array($reportKey, ['overall_progress', 'completion_velocity', 'tasks_completed_last_7_days', 'tasks_completed_last_6_weeks', 'tasks_completed_last_6_months', 'tasks_completed_per_user', 'tasks_by_status', 'users_task_load', 'estimate_vs_actual', 'estimate_vs_actual_date', 'delay_per_user', 'performance_leaderboard', 'section_cards'])) {
            // heuristics for percent-like reports
            if (in_array($reportKey, ['overall_progress', 'completion_velocity', 'section_cards'])) {
                $unit = 'percent';
            } else {
                $unit = 'count';
            }
        }

        $data['summary'] = [
            'current_total' => $curr,
            'previous_total' => $prev,
            'difference' => $diff,
            'percentage_change' => $pct,
            'percentage_change_reason' => $percentage_change_reason,
            'unit' => $unit,
            'previous_computed' => $previous_computed,
        ];

        // mark composite summaries as non-comparable
        if (in_array($reportKey, ['section_cards', 'overall_progress'])) {
            $data['summary']['type'] = 'composite';
            $data['summary']['comparable'] = false;
            $data['summary']['reason'] = 'mixed_metrics';
        }

        // 📊 Aggregation metadata for time-based charts
        if (isset($periodMeta['aggregation'])) {
            $data['aggregation'] = $periodMeta['aggregation'];
            $data['is_rolling'] = $periodMeta['is_rolling'] ?? true;
        } else {
            $data['aggregation'] = null;
            $data['is_rolling'] = false;
        }

        // 🔍 Attention items (deterministic rules)
        // pass report key if available (front controllers use keys when assembling reports)
        $reportKey = $data['__report_key'] ?? null;
        $data['attention_items'] = $this->generateAttentionItems($reportKey, $data);

        // Clarify data_count meaning for AI consumers
        $records = isset($data['data_count']) ? $data['data_count'] : (isset($data['chart_data']) ? (is_countable($data['chart_data']) ? count($data['chart_data']) : null) : null);
        // determine records_type per report key
        $records_type_map = [
            'tasks_completed_last_7_days' => 'tasks',
            'tasks_completed_last_6_weeks' => 'tasks',
            'tasks_completed_last_6_months' => 'tasks',
            'tasks_completed_per_user' => 'tasks',
            'tasks_by_status' => 'tasks',
            'users_task_load' => 'tasks',
            'estimate_vs_actual_date' => 'users',
            'estimate_vs_actual' => 'categories',
            'delay_per_user' => 'users',
            'performance_leaderboard' => 'users',
            'rating_per_category' => 'tasks',
            'completion_velocity' => 'tasks',
            'performance_rating_trend' => 'tasks',
            'section_cards' => 'composite',
            'overall_progress' => 'composite',
        ];
        $records_type = $records_type_map[$reportKey] ?? 'records';
        $data['counts'] = [
            'records' => $records,
            'records_type' => $records_type
        ];

        // Remove internal helper key to keep payload clean
        if (isset($data['__report_key'])) unset($data['__report_key']);

        return $data;
    }

    // Apply common filters to query builder
    private function applyFilters($query, $id, $filter)
    {
        // User ID filter
        if ($id) {
            $query->whereHas('assignees', function ($q) use ($id) {
                $q->where('users.id', $id);
            });
        }

        if (!$filter) {
            return $query;
        }

        // Multiple users filter
        if (isset($filter['users'])) {
            $userIds = explode(',', $filter['users']);
            $query->whereHas('assignees', function ($q) use ($userIds) {
                $q->whereIn('users.id', $userIds);
            });
        }

        // Date range filter
        if (!empty($filter['from']) && !empty($filter['to'])) {
            $query->whereRaw('COALESCE(actual_date, end_date, start_date) BETWEEN ? AND ?', [$filter['from'], $filter['to']]);
        }

        // Projects filter
        if (isset($filter['projects'])) {
            $projectIds = explode(',', $filter['projects']);
            $query->whereIn('project_id', $projectIds);
        }

        // Epics filter
        if (isset($filter['epics'])) {
            $epicIds = explode(',', $filter['epics']);
            $query->whereHas('project', function ($q) use ($epicIds) {
                $q->whereIn('epic_id', $epicIds);
            });
        }

        return $query;
    }

    /* ----------------------------- SHARED REPORTS ----------------------------- */
    // Overall Progress
    public function overallProgress($id = null, $filter)
    {
        $progress_query = $this->task
            ->where('organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                    $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                });
            });
        $progress_query = $this->applyFilters($progress_query, $id, $filter);
        $cancelled = $this->task_status->where('name', 'cancelled')->where('organization_id', $this->organization_id)->value('id');
        $completed = $this->task_status->where('name', 'completed')->where('organization_id', $this->organization_id)->value('id');
        // Total tasks excluding cancelled
        $totalTasks = (clone $progress_query)->where('status_id', '!=', $cancelled)->where('status_id', '!=', null)->count();
        // Completed tasks count
        $completedTasks = (clone $progress_query)->where('status_id', $completed)->count();

        $progress = $totalTasks > 0
            ? round(($completedTasks / $totalTasks) * 100, 2)
            : 0;

        $data = [
            'progress' => $progress,
            'filters' => $filter
        ];

        // 🧠 Attach AI metadata (all-time unless filter provided)
        $periodMeta = $this->buildPeriod($filter, null, null);
        // include internal key for rules to identify report
        $data['__report_key'] = 'overall_progress';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $completedTasks, null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch progress', false, 404);
        }

        return apiResponse($data, "Progress report fetched successfully");
    }

    // Section Cards
    public function sectionCards($id = null, $filter)
    {
        // Get completed status ID once
        $completed = $this->task_status->where('name', 'Completed')->where('organization_id', $this->organization_id)->value('id');
        $cancelled = $this->task_status->where('name', 'Cancelled')->where('organization_id', $this->organization_id)->value('id');

        // Base query builder with common filters
        $baseQuery = $this->task->where('organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                    $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                });
            });
        // Apply common filters to base query
        $baseQuery = $this->applyFilters($baseQuery, $id, $filter);

        // Base query builder with common filters (exclude subtasks)
        $baseQueryXSubtasks = $this->task->where('organization_id', $this->organization_id)
            ->whereNull('parent_id');
        // Apply common filters to base query (exclude subtasks)
        $baseQueryXSubtasks = $this->applyFilters($baseQueryXSubtasks, $id, $filter);

        // Tasks at risk query (has unique conditions)
        $taskAtRiskQuery = (clone $baseQuery)
            ->where('status_id', '!=', $completed)
            ->where('end_date', '<=', now()->addDays(3))
            ->where('end_date', '>=', now());
        // Tasks at ahread of schedule query (has unique conditions)
        $taskAheadOfScheduleQuery = (clone $baseQuery)
            ->where('status_id', $completed)
            ->whereColumn('actual_date', '<', 'end_date');

        // Task Completion query (has unique conditions)
        $taskCompletionQuery = 0;
        $totalTasks = (clone $baseQuery)->where('status_id', '!=', $cancelled)->where('status_id', '!=', null)->count();
        if ($totalTasks !== 0) {
            $completedTasks = (clone $baseQuery)->where('status_id', $completed)->count();

            $taskCompletionQuery = round(($completedTasks / $totalTasks) * 100, 2);
        }

        // Subtasks per parent task
        $parentCount = $this->task->where('organization_id', $this->organization_id)->whereNull('parent_id')->whereHas('children')->count();
        $childrenCount = $this->task->where('organization_id', $this->organization_id)->whereNotNull('parent_id')->count();
        $subtasksPerParentTask = 0;
        if ($parentCount !== 0 && $childrenCount !== 0) {
            $subtasksPerParentTask = round($childrenCount / $parentCount, 2);
        }

        // Execute all queries
        $data = [
            'avg_performance' => round((clone $baseQuery)->avg('performance_rating'), 2),
            'task_at_risk' => $taskAtRiskQuery->count(),
            'avg_completion_time' => round(
                $this->task->where('status_id', $completed)
                    ->where('organization_id', $this->organization_id)
                    ->where(function ($query) {
                        $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                            $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                        });
                    })
                    ->avg('time_taken'),
                2
            ),
            'time_efficiency' => round((clone $baseQuery)->where('status_id', $completed)->avg(DB::raw('time_estimate / time_taken * 100')), 2),
            'completion_rate' => $taskCompletionQuery,
            'average_delay_days' => round((clone $baseQueryXSubtasks)->where('status_id', '!=', $cancelled)->avg('delay_days'), 2),
            'total_delay_days' => round((clone $baseQueryXSubtasks)->where('status_id', '!=', $cancelled)->sum('delay_days'), 2),
            'average_days_per_task' => round((clone $baseQueryXSubtasks)->where('status_id', $completed)->avg('days_taken'), 2),
            'tasks_ahead_of_schedule' => $taskAheadOfScheduleQuery->count(),
            'average_tasks_completed_per_day' => round((clone $baseQuery)->where('status_id', $completed)->selectRaw('COUNT(*) / NULLIF(COUNT(DISTINCT DATE(actual_date)), 0) as avg_per_day')->value('avg_per_day'), 2),
            'average_estimated_days' => round((clone $baseQuery)->where('status_id', $completed)->avg('days_estimate'), 2),
            'average_actual_days' => round((clone $baseQuery)->where('status_id', $completed)->avg('days_taken'), 2),
            'delay_frequency_percentage' => round((clone $baseQuery)->where('status_id', '!=', $cancelled)
                ->selectRaw('(SUM(CASE WHEN delay_days > 0 THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(*), 0) AS delay_percent')->value('delay_percent'), 2),
            'subtasks_per_parent_task' => $subtasksPerParentTask,
            'filters' => $filter
        ];

        // 🧠 Attach metadata (use filter-derived period or all_time)
        $periodMeta = $this->buildPeriod($filter, null, null);
        $data['__report_key'] = 'section_cards';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $taskCompletionQuery, null);

        if (empty(array_filter($data, fn($value) => !is_null($value) && $value !== 'filters'))) {
            return apiResponse(null, 'Failed to fetch active users report', false, 404);
        }

        return apiResponse($data, "Active users report fetched successfully");
    }

    // Task status - Pie donut chart
    public function tasksCompletedPerUser($id = null, $variant = "", $filter)
    {
        $taskCount = $this->task->where('organization_id', $this->organization_id)->count();
        // Get all users, even without tasks, via task_assignees table relation, and get all their assigned tasks
        $query = $this->task
            ->leftJoin('task_assignees', function ($join) {
                $join->on('tasks.id', '=', 'task_assignees.task_id');
            })
            ->leftJoin('users', function ($join) {
                $join->on('users.id', '=', 'task_assignees.assignee_id')
                    ->where('users.organization_id', $this->organization_id);
            })
            ->leftJoin('task_statuses', 'tasks.status_id', '=', 'task_statuses.id')
            ->where('tasks.organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('tasks.parent_id') // include only subtasks
                    ->orWhere(function ($subQuery) {
                        $subQuery->whereNull('tasks.parent_id')
                            ->whereRaw('NOT EXISTS (SELECT 1 FROM tasks t WHERE t.parent_id = tasks.id)');
                    });
            });

        // Apply filters
        $query = $this->applyFilters($query, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null));

        $query->where('task_statuses.name', '=', 'Completed');

        $chart_data = $query->select(
            'users.name as user',
            DB::raw('COUNT(tasks.id) as task')
        )
            ->groupBy('users.name')->get();


        // Get users with highest and lowest task completed
        $highest = null;
        $lowest = null;
        foreach ($chart_data as $item) {
            if (!$highest || $item->task > $highest->task)
                $highest = $item;
            if (!$lowest || $item->task < $lowest->task)
                $lowest = $item;
        }

        $data = [
            'chart_data' => $chart_data,
            'highest' => $highest,
            'lowest' => $lowest,
            'data_count' => $taskCount,
            'filters' => $filter
        ];

        // 🧠 Attach metadata (period: derived from filter or all_time)
        $periodMeta = $this->buildPeriod($filter, null, null);
        $data['__report_key'] = 'tasks_completed_per_user';
        // current_total = total tasks completed in this context; using data_count if available
        $data = $this->attachMetadata($data, $filter, $periodMeta, $taskCount, null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch tasks completed per user', false, 404);
        }

        return apiResponse($data, "Tasks completed per user report fetched successfully");
    }

    // Tasks completed - Last 7 Days - Bar chart
    public function tasksCompletedLast7Days($id = null, $variant = "", $filter)
    {
        // 🧠 Use dynamic period (default last 7 days)
        $periodMeta = $this->buildPeriod($filter, 'days', 7);
        $startDate = Carbon::parse($periodMeta['period']['from']);
        $endDate = Carbon::parse($periodMeta['period']['to']);

        $query = $this->task
            ->where('organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                    $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                });
            })
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->whereBetween('actual_date', [$startDate->toDateString(), $endDate->toDateString()]);

        // Apply filters (consistent)
        $query = $this->applyFilters($query, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null));

        // Group by date
        $tasks = $query
            ->selectRaw('DATE(actual_date) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        // Prepare chart data (Mon–Sun labels)
        $chart_data = [];
        $total = 0;

        for ($i = 0; $i < 7; $i++) {
            $date = $startDate->copy()->addDays($i);
            $dayData = $tasks->firstWhere('date', $date->format('Y-m-d'));
            $count = $dayData ? $dayData->count : 0;
            $total += $count;

            $chart_data[] = [
                'label' => $date->format('D'), // Mon, Tue, ..., Sun
                'tasks_completed' => $count,
            ];
        }

        $data = [
            'chart_data' => $chart_data,
            'data_count' => $total,
            'filters' => $filter
        ];

        // 🧠 Attach metadata & summary (compute previous period total)
        $prevStart = Carbon::parse($periodMeta['comparison']['from']);
        $prevEnd = Carbon::parse($periodMeta['comparison']['to']);
        $prevTotal = (clone $this->task)
            ->where('organization_id', $this->organization_id)
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->whereBetween('actual_date', [$prevStart->toDateString(), $prevEnd->toDateString()]);
        $prevTotal = $this->applyFilters($prevTotal, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null))->count();

        $data['__report_key'] = 'tasks_completed_last_7_days';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $total, $prevTotal);

        return apiResponse($data, "Tasks completed in the last 7 days fetched successfully");
    }

    // Tasks completed - Last 8 Weeks - Bar chart
    public function tasksCompletedLast6Weeks($id = null, $variant = "", $filter)
    {
        // 🧠 dynamic 6-week window
        $periodMeta = $this->buildPeriod($filter, 'weeks', 6);
        $startDate = Carbon::parse($periodMeta['period']['from']);
        $endDate = Carbon::parse($periodMeta['period']['to']);

        $query = $this->task
            ->where('organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                    $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                });
            })
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->whereBetween('actual_date', [$startDate->toDateString(), $endDate->toDateString()]);

        // Apply filters
        $query = $this->applyFilters($query, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null));

        $tasks = $query
            ->selectRaw('YEAR(actual_date) as year, WEEK(actual_date, 0) as week, COUNT(*) as count')
            ->groupBy('year', 'week')
            ->orderBy('year')
            ->orderBy('week')
            ->get();

        $chart_data = [];
        $total = 0;

        for ($i = 0; $i < 6; $i++) {
            $weekStart = $startDate->copy()->addWeeks($i)->startOfWeek(Carbon::SUNDAY);
            $year = $weekStart->year;
            $week = $weekStart->format('W');

            $weekData = $tasks->firstWhere(fn($t) => $t->year == $year && (int)$t->week == (int)$week);
            $count = $weekData ? $weekData->count : 0;
            $total += $count;

            $chart_data[] = [
                'label' => 'Week ' . $week, // e.g. Week 40
                'tasks_completed' => $count,
            ];
        }

        $data = [
            'chart_data' => $chart_data,
            'data_count' => $total,
            'filters' => $filter,
        ];

        // previous total
        $prevStart = Carbon::parse($periodMeta['comparison']['from']);
        $prevEnd = Carbon::parse($periodMeta['comparison']['to']);
        $prevTotal = (clone $this->task)
            ->where('organization_id', $this->organization_id)
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->whereBetween('actual_date', [$prevStart->toDateString(), $prevEnd->toDateString()]);
        $prevTotal = $this->applyFilters($prevTotal, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null))->count();

        $data['__report_key'] = 'tasks_completed_last_6_weeks';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $total, $prevTotal);

        return apiResponse($data, "Tasks completed in the last 8 weeks fetched successfully");
    }

    // Tasks completed - Last 6 Months - Bar chart
    public function tasksCompletedLast6Months($id = null, $variant = "", $filter)
    {
        // 🧠 dynamic 6-month window
        $periodMeta = $this->buildPeriod($filter, 'months', 6);
        $startDate = Carbon::parse($periodMeta['period']['from']);
        $endDate = Carbon::parse($periodMeta['period']['to']);

        $query = $this->task
            ->where('organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                    $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                });
            })
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->whereBetween('actual_date', [$startDate->toDateString(), $endDate->toDateString()]);

        // Apply filters
        $query = $this->applyFilters($query, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null));

        $tasks = $query
            ->selectRaw('YEAR(actual_date) as year, MONTH(actual_date) as month, COUNT(*) as count')
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get();

        $chart_data = [];
        $total = 0;

        for ($i = 0; $i < 6; $i++) {
            $monthDate = $startDate->copy()->addMonths($i);
            $year = $monthDate->year;
            $month = $monthDate->month;

            $monthData = $tasks->firstWhere(fn($t) => $t->year == $year && $t->month == $month);
            $count = $monthData ? $monthData->count : 0;
            $total += $count;

            $chart_data[] = [
                'label' => $monthDate->format('M'), // Jan, Feb, ...
                'tasks_completed' => $count,
            ];
        }

        $data = [
            'chart_data' => $chart_data,
            'data_count' => $total,
            'filters' => $filter,
        ];

        // previous total
        $prevStart = Carbon::parse($periodMeta['comparison']['from']);
        $prevEnd = Carbon::parse($periodMeta['comparison']['to']);
        $prevTotal = (clone $this->task)
            ->where('organization_id', $this->organization_id)
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->whereBetween('actual_date', [$prevStart->toDateString(), $prevEnd->toDateString()]);
        $prevTotal = $this->applyFilters($prevTotal, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null))->count();

        $data['__report_key'] = 'tasks_completed_last_6_months';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $total, $prevTotal);

        return apiResponse($data, "Tasks completed in the last 6 months fetched successfully");
    }

    // Task status - Pie donut chart
    public function tasksByStatus($id = null, $variant = "", $filter)
    {
        // Fetch statuses from DB (only id & name)
        $statuses = $this->task_status->select('id', 'name')->where('organization_id', $this->organization_id)->get();

        $chart_data = [];
        foreach ($statuses as $index => $status) {
            $chart_data[$index]['status_id'] = $status->id;
            $chart_data[$index]['status'] = $status->name;

            $query = $this->task
                ->where('organization_id', $this->organization_id)
                ->where('status_id', $status->id)
                ->where(function ($query) {
                    $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                        $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                    });
                });
            // Only apply filters for dashboard variant (to match previous logic)
            $query = $this->applyFilters($query, ($variant !== 'dashboard' ? $id : null), $filter);
            $chart_data[$index]['tasks'] = $query->count();
            $chart_data[$index]['fill'] = 'var(--color-' . str($status->name)->slug('_') . ')';
            // turns "In Progress" → "in_progress"
        }

        $data = [
            'chart_data' => $chart_data,
            'filters' => $filter
        ];

        // 🧠 Attach metadata (period from filter or all_time)
        $periodMeta = $this->buildPeriod($filter, null, null);
        $data['__report_key'] = 'tasks_by_status';
        $data = $this->attachMetadata($data, $filter, $periodMeta, array_sum(array_column($chart_data, 'tasks')), null);

        if (empty($data['chart_data'])) {
            return apiResponse(null, 'Failed to fetch task by status report', false, 404);
        }

        return apiResponse($data, "Task by status report fetched successfully");
    }

    // Performance Trend - Line chart label
    public function performanceRatingTrend($id = null, $variant = "", $filter)
    {

        // 🧠 dynamic last 6 months window (unless filter provides explicit range)
        $periodMeta = $this->buildPeriod($filter, 'months', 6);
        // use filter['to'] or period from buildPeriod to construct months array
        $startDate = isset($filter['to']) ? Carbon::parse($filter['to'])->startOfMonth() : Carbon::parse($periodMeta['period']['from'])->startOfMonth();

        // Calculate the last 6 months (including current)
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = $startDate->copy()->subMonths($i);
            $months[] = [
                'year' => $date->year,
                'month' => $date->format('F'),
                'month_num' => $date->month,
            ];
        }

        $chart_data = [];
        $task_count = 0;
        foreach ($months as $m) {
            $query = $this->task
                ->where('organization_id', $this->organization_id)
                ->where(function ($query) {
                    $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                        $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                    });
                })
                ->whereRaw('YEAR(COALESCE(actual_date, end_date, start_date)) = ? AND MONTH(COALESCE(actual_date, end_date, start_date)) = ?', [$m['year'], $m['month_num']]);
            $query = $this->applyFilters($query, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null));
            $rating = $query->select(
                DB::raw('AVG(performance_rating) as average_rating'),
                DB::raw('COUNT(id) as task_count')
            )->first();

            $chart_data[] = [
                'year' => $m['year'],
                'month' => $m['month'],
                'rating' => round($rating->average_rating, 2),
            ];
            $task_count += $rating->task_count ?? 0;
        }

        // Calculate percentage difference (current vs previous month)
        $month1 = $chart_data[5]['rating'];
        $month2 = $chart_data[4]['rating'];
        $percentageDifference = [
            'value' => ($month2 != 0)
                ? round(abs((($month1 - $month2) / $month2) * 100), 2)
                : ($month1 > 0 ? 100 : 0),
            'event' => $month1 > $month2 ? 'Increased' : ($month1 < $month2 ? 'Decreased' : 'Same'),
        ];

        $data = [
            'chart_data' => $chart_data,
            'percentage_difference' => $percentageDifference,
            'task_count' => $task_count,
            'filters' => $filter
        ];

        $data['__report_key'] = 'performance_rating_trend';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $task_count, null);

        if (empty($data['chart_data'])) {
            return apiResponse(null, 'Failed to fetch task activity timeline report', false, 404);
        }

        return apiResponse($data, "Performance rating trend report fetched successfully");
    }

    // Completion Velocity - monthly completion rate for last 6 months
    public function completionVelocityTrend($id = null, $variant = "", $filter)
    {
        // 🧠 dynamic last 6 months
        $periodMeta = $this->buildPeriod($filter, 'months', 6);
        $startDate = isset($filter['to']) ? Carbon::parse($filter['to'])->startOfMonth() : Carbon::parse($periodMeta['period']['from'])->startOfMonth();

        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = $startDate->copy()->subMonths($i);
            $months[] = [
                'year' => $date->year,
                'month' => $date->format('F'),
                'month_num' => $date->month,
            ];
        }

        $chart_data = [];
        $task_count = 0;

        // status ids for completed/cancelled
        $completedStatus = $this->task_status->where('name', 'Completed')->where('organization_id', $this->organization_id)->value('id');
        $cancelledStatus = $this->task_status->where('name', 'Cancelled')->where('organization_id', $this->organization_id)->value('id');

        foreach ($months as $m) {
            $baseQuery = $this->task
                ->where('organization_id', $this->organization_id)
                ->where(function ($query) {
                    $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                        $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                    });
                })
                ->whereRaw('YEAR(COALESCE(actual_date, end_date, start_date)) = ? AND MONTH(COALESCE(actual_date, end_date, start_date)) = ?', [$m['year'], $m['month_num']]);

            // apply the same filters logic used elsewhere
            $baseQuery = $this->applyFilters($baseQuery, ($variant !== 'dashboard' ? $id : null), $filter);

            $total = (clone $baseQuery)->where('status_id', '!=', $cancelledStatus)->where('status_id', '!=', null)->count();
            $completed = (clone $baseQuery)->where('status_id', $completedStatus)->count();

            $rate = $total > 0 ? round(($completed / $total) * 100, 2) : 0;

            $chart_data[] = [
                'year' => $m['year'],
                'month' => $m['month'],
                'rating' => $rate,
            ];

            $task_count += $total;
        }
        // Calculate percentage difference (current vs previous month)
        $month1 = $chart_data[5]['rating'];
        $month2 = $chart_data[4]['rating'];
        $percentageDifference = [
            'value' => ($month2 != 0)
                ? round(abs((($month1 - $month2) / $month2) * 100), 2)
                : ($month1 > 0 ? 100 : 0),
            'event' => $month1 > $month2 ? 'Increased' : ($month1 < $month2 ? 'Decreased' : 'Same'),
        ];

        $data = [
            'chart_data' => $chart_data,
            'percentage_difference' => $percentageDifference,
            'data_count' => $task_count,
            'filters' => $filter,
        ];

        $data['__report_key'] = 'completion_velocity';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $task_count, null);

        if (empty($data['chart_data'])) {
            return apiResponse(null, 'Failed to fetch completion velocity report', false, 404);
        }

        return apiResponse($data, "Completion velocity report fetched successfully");
    }

    // Underrun vs Overruns based on date. Bar chart multiple
    public function estimateVsActualDate($id = null, $filter)
    {
        $taskCount = $this->task->where('organization_id', $this->organization_id)->count();
        // Get all users, even without tasks, via task_assignees table relation, and get all their assigned tasks
        $query = $this->user
            ->leftJoin('task_assignees', function ($join) {
                $join->on('users.id', '=', 'task_assignees.assignee_id');
            })
            ->leftJoin('tasks', function ($join) {
                $join->on('tasks.id', '=', 'task_assignees.task_id')
                    ->where('tasks.organization_id', $this->organization_id);
            })
            ->where('users.organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('tasks.parent_id') // include only subtasks
                    ->orWhere(function ($subQuery) {
                        $subQuery->whereNull('tasks.parent_id')
                            ->whereRaw('NOT EXISTS (SELECT 1 FROM tasks t WHERE t.parent_id = tasks.id)');
                    });
            })
            ->select(
                'users.name as assignee',
                DB::raw('ROUND(SUM(days_taken - days_estimate),2) as net_difference'),
                DB::raw('ROUND(SUM(CASE WHEN days_taken > 0 AND days_estimate IS NOT NULL AND days_taken > days_estimate THEN days_taken - days_estimate ELSE 0 END), 2) as overrun'),
                DB::raw('ROUND(SUM(CASE WHEN days_taken > 0 AND days_estimate IS NOT NULL AND days_taken < days_estimate THEN days_estimate - days_taken ELSE 0 END), 2) as underrun')
            );

        // 🧠 Use computed period if provided, otherwise respect existing filter semantics
        $periodMeta = $this->buildPeriod($filter, null, null);
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('start_date', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }
        if ($filter && isset($filter['projects'])) {
            $projectIds = explode(',', $filter['projects']); // turns "10,9" into [10, 9]
            $query->whereIn('project_id', $projectIds);
        }
        if ($filter && isset($filter['users'])) {
            $userIds = explode(',', $filter['users']); // turns "10,9" into [10, 9]
            $query->whereIn('users.id', $userIds);
        }
        $chart_data = $query->groupBy('users.name')
            ->get();

        $runs = [
            'over' => round($chart_data->sum('overrun'), 2),
            'under' => round($chart_data->sum('underrun'), 2),
            'net' => round($chart_data->sum('net_difference'), 2),
        ];

        $userCount = count($chart_data);

        $data = [
            'chart_data' => $chart_data,
            'runs' => $runs,
            'data_count' => $userCount, //data_count is used by the chart
            'filters' => $filter
        ];

        $data['__report_key'] = 'estimate_vs_actual_date';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $userCount, null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch estimate vs actual report', false, 404);
        }

        return apiResponse($data, "Estimate vs actual report fetched successfully");
    }

    // Overrun vs Underrun ratio - Pie chart
    public function overrunUnderrunRatio($id = null, $variant = "", $filter)
    {
        // Only consider tasks with estimate and actual days recorded and completed
        $completed = $this->task_status->where('name', 'Completed')->where('organization_id', $this->organization_id)->value('id');

        $query = $this->task->where('organization_id', $this->organization_id)
            ->whereNotNull('days_estimate')
            ->where('days_estimate', '>', 0)
            ->whereNotNull('days_taken')
            ->where('days_taken', '>', 0)
            ->where('status_id', $completed);

        // Apply filters (dashboard variant passes filter differently)
        $query = $this->applyFilters($query, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null));

        $totalTasks = (clone $query)->count();

        $overrunCount = (clone $query)->whereRaw('days_taken > days_estimate')->count();
        $underrunCount = (clone $query)->whereRaw('days_taken < days_estimate')->count();
        $onTimeCount = $totalTasks - $overrunCount - $underrunCount;

        $overrunPct = $totalTasks > 0 ? round(($overrunCount / $totalTasks) * 100, 2) : 0;
        $underrunPct = $totalTasks > 0 ? round(($underrunCount / $totalTasks) * 100, 2) : 0;
        $onTimePct = $totalTasks > 0 ? round(($onTimeCount / $totalTasks) * 100, 2) : 0;

        $chart_data = [
            [
                'label' => 'Underrun',
                'value' => $underrunPct,
                'count' => $underrunCount,
            ],
            [
                'label' => 'Overrun',
                'value' => $overrunPct,
                'count' => $overrunCount,
            ],
            [
                'label' => 'On Time',
                'value' => $onTimePct,
                'count' => $onTimeCount,
            ],
        ];

        $data = [
            'chart_data' => $chart_data,
            'data_count' => $totalTasks > 0 ? 1 : 0,
            'filters' => $filter ?? null,
        ];

        $periodMeta = $this->buildPeriod($filter, null, null);
        $data['__report_key'] = 'overrun_underrun_ratio';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $totalTasks, null);

        if (empty($data['chart_data'])) {
            return apiResponse(null, "No data found", 200, false);
        }

        return apiResponse($data, "Overrun/Underrun ratio fetched successfully");
    }

    // Delays per user - Bar chart
    public function delaysPerUser($id = null, $filter)
    {
        $cancelled = $this->task_status->where('name', 'Cancelled')->where('organization_id', $this->organization_id)->value('id');
        $taskCount = $this->task->where('organization_id', $this->organization_id)->count();
        // Get all users, even without tasks, via task_assignees table relation, and get all their assigned tasks
        $query = $this->user
            ->leftJoin('task_assignees', function ($join) {
                $join->on('users.id', '=', 'task_assignees.assignee_id');
            })
            ->leftJoin('tasks', function ($join) use ($cancelled) {
                $join->on('tasks.id', '=', 'task_assignees.task_id')
                    ->where('tasks.organization_id', $this->organization_id)
                    ->where('tasks.status_id', '!=', $cancelled);
            })
            ->where('users.organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('tasks.parent_id') // include only subtasks
                    ->orWhere(function ($subQuery) {
                        $subQuery->whereNull('tasks.parent_id')
                            ->whereRaw('NOT EXISTS (SELECT 1 FROM tasks t WHERE t.parent_id = tasks.id)');
                    });
            })
            ->select(
                'users.name as assignee',
                DB::raw('SUM(CASE WHEN delay_days > 0 THEN delay_days ELSE 0 END) as delay'),
            );

        // 🧠 Use computed period if provided
        $periodMeta = $this->buildPeriod($filter, null, null);
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('start_date', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }
        if ($filter && isset($filter['projects'])) {
            $projectIds = explode(',', $filter['projects']); // turns "10,9" into [10, 9]
            $query->whereIn('project_id', $projectIds);
        }
        if ($filter && isset($filter['users'])) {
            $userIds = explode(',', $filter['users']); // turns "10,9" into [10, 9]
            $query->whereIn('users.id', $userIds);
        }
        $chart_data = $query->groupBy('users.name')
            ->get();

        $runs = [
            'delay' => $chart_data->sum('delay'),
        ];

        $userCount = count($chart_data);

        $data = [
            'chart_data' => $chart_data,
            // get row with highest and lowest delay including user name
            'highest_delay' => $chart_data->sortByDesc('delay')->first(),
            'lowest_delay' => $chart_data->sortBy('delay')->first(),
            'data_count' => $taskCount,
            'filters' => $filter
        ];

        $data['__report_key'] = 'delay_per_user';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $chart_data->sum('delay'), null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch delay per user report', false, 404);
        }

        return apiResponse($data, "Delay per user report fetched successfully");
    }

    /* ------------------------------ USER REPORTS ------------------------------ */
    // User Taskload. Area chart
    public function taskActivityTimeline($id, $filter)
    {
        // 🧠 dynamic last 6 months (or based on filter)
        $periodMeta = $this->buildPeriod($filter, 'months', 6);
        $startDate = isset($filter['to']) ? Carbon::parse($filter['to'])->startOfMonth() : Carbon::parse($periodMeta['period']['from'])->startOfMonth();

        // Calculate the last 6 months (including current)
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = $startDate->copy()->subMonths($i);
            $months[] = [
                'year' => $date->year,
                'month' => $date->format('F'),
                'month_num' => $date->month,
            ];
        }

        $chart_data = [];
        $task_count = 0;
        foreach ($months as $m) {
            $query = $this->task
                ->whereHas('assignees', function ($query) use ($id) {
                    $query->where('users.id', $id);
                })
                ->where('organization_id', $this->organization_id)
                ->whereYear('start_date', $m['year'])
                ->whereMonth('start_date', $m['month_num'])
                ->where(function ($query) {
                    $query->whereNotNull('parent_id')->orWhere(function ($subQuery) { // dont include parent tasks in metrics
                        $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                    });
                });

            if ($filter && $filter['from'] && $filter['to']) {
                $query->whereBetween('start_date', [$filter['from'], $filter['to']]);
            }
            if ($filter && isset($filter['projects'])) {
                $projectIds = explode(',', $filter['projects']); // turns "10,9" into [10, 9]
                $query->whereIn('project_id', $projectIds);
            }
            $count = $query->count();

            $chart_data[] = [
                'year' => $m['year'],
                'month' => $m['month'],
                'tasks' => $count,
            ];
            $task_count = $task_count + $count;
        }

        // Calculate percentage difference (current vs previous month)
        $month1 = $chart_data[5]['tasks'];
        $month2 = $chart_data[4]['tasks'];
        $percentageDifference = [
            'value' => ($month2 != 0)
                ? round(abs((($month1 - $month2) / $month2) * 100), 2)
                : ($month1 > 0 ? 100 : 0),
            'event' => $month1 > $month2 ? 'Increased' : ($month1 < $month2 ? 'Decreased' : 'Same'),
        ];

        $data = [
            'percentage_difference' => $percentageDifference,
            'chart_data' => $chart_data,
            'task_count' => $task_count,
            'filters' => $filter
        ];

        $data['__report_key'] = 'task_activity_timeline';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $task_count, null);

        if (empty($data['chart_data'])) {
            return apiResponse(null, 'Failed to fetch task activity timeline report', false, 404);
        }

        return apiResponse($data, "Task activity timeline report fetched successfully");
    }
    // Average Rating Per Category. Radar chart
    public function ratingPerCategory($id, $filter)
    {
        $query = $this->category
            ->leftJoin('tasks', function ($join) use ($id, $filter) {
                $join->on('tasks.category_id', '=', 'categories.id');

                // Filter by assignee
                if ($id) {
                    $join->leftJoin('task_assignees', 'tasks.id', '=', 'task_assignees.task_id')
                        ->where('task_assignees.assignee_id', $id);
                }
                if ($filter && $filter['from'] && $filter['to']) {
                    $join->whereBetween('tasks.start_date', [$filter['from'], $filter['to']]);
                }
                if ($filter && isset($filter['projects'])) {
                    $projectIds = explode(',', $filter['projects']); // turns "10,9" into [10, 9]
                    $join->whereIn('project_id', $projectIds);
                }
            })
            ->where('categories.organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('tasks.parent_id') // include only subtasks
                    ->orWhere(function ($subQuery) {
                        $subQuery->whereNull('tasks.parent_id')
                            ->whereRaw('NOT EXISTS (SELECT 1 FROM tasks t WHERE t.parent_id = tasks.id)');
                    });
            });

        $ratings = $query->select(
            'categories.name as category',
            DB::raw('AVG(tasks.performance_rating) as average_rating'),
            DB::raw('COUNT(tasks.id) as task_count')
        )
            ->groupBy('categories.id', 'categories.name')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category,
                    'value' => is_null($item->average_rating) ? 0 : round($item->average_rating, 2),
                    'task_count' => $item->task_count
                ];
            });
        $task_count = $ratings->sum('task_count');
        $highestRatingValue = $ratings->max('value');
        $highestRatingCategory = $ratings->firstWhere('value', $highestRatingValue);
        $highestRating = [
            'category' => $highestRatingCategory ? $highestRatingCategory['category'] : null,
            'value' => $highestRatingValue
        ];
        $data = [
            "highest_rating" => $highestRating,
            "ratings" => $ratings,
            "task_count" => $task_count,
            "filters" => $filter
        ];

        $periodMeta = $this->buildPeriod($filter, null, null);
        $data['__report_key'] = 'rating_per_category';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $task_count, null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch rating per category report', false, 404);
        }

        return apiResponse($data, "Rating per category report fetched successfully");
    }

    // 10 recent tasks estimate vs actual. Bar chart multiple
    public function userEstimateVsActual($id, $filter)
    {
        // Fetch the 10 most recent tasks for the user
        $query = $this->task
            ->where('organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('parent_id')->orWhere(function ($subQuery) {
                    $subQuery->whereNull('parent_id')->whereDoesntHave('children');
                });
            });
        $query = $this->applyFilters($query, $id, $filter);
        $tasks = $query->orderBy('start_date', 'desc')
            ->take(10)
            ->get(['title', 'time_estimate', 'time_taken', 'start_date']);

        // Prepare the data for the bar chart
        $chart_data = [];
        $runs = [
            'over' => null,
            'under' => null,
            'exact' => 0
        ];
        foreach ($tasks as $index => $task) {
            $chart_data[] = [
                'task' => $task->title,
                'estimate' => round($task->time_estimate, 2),
                'actual' => round($task->time_taken, 2),
                'net_difference' => 0
            ];

            // Calculate percentage difference for each task
            $chart_data[$index]['net_difference'] = round($chart_data[$index]['estimate'] - $chart_data[$index]['actual'], 2);
            if (mb_strlen($chart_data[$index]['task']) > 15) {
                $chart_data[$index]['task'] = mb_substr($chart_data[$index]['task'], 0, 15) . '...' . " (" . $chart_data[$index]['net_difference'] . ")";
            } else {
                $chart_data[$index]['task'] = $chart_data[$index]['task'] . " (" . $chart_data[$index]['net_difference'] . ")";
            }

            // Get total underruns and overruns
            if ($chart_data[$index]['net_difference'] < 0) {
                $runs['over'] += $chart_data[$index]['net_difference'];
                $runs['over'] = round($runs['over'], 2);
            } elseif ($chart_data[$index]['net_difference'] > 0) {
                $runs['under'] += $chart_data[$index]['net_difference'];
                $runs['under'] = round($runs['under'], 2);
            } else
                $runs['exact']++;
        }

        $taskCount = count($chart_data);

        $data = [
            'chart_data' => $chart_data,
            'runs' => $runs,
            'data_count' => $taskCount,
            'filters' => $filter
        ];

        $periodMeta = $this->buildPeriod($filter, null, null);
        $data['__report_key'] = 'estimate_vs_actual';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $taskCount, null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch estimate vs actual report', false, 404);
        }

        return apiResponse($data, "Estimate vs actual report fetched successfully");
    }

    /* ---------------------------- DASHBOARD REPORTS --------------------------- */
    // Users activity load. Horizontal Bar chart
    public function usersTaskLoad($filter)
    {
        $taskCount = $this->task->where('organization_id', $this->organization_id)->count();

        // Get all users, even without tasks, via task_assignees table relation, and get all their assigned tasks
        $query = $this->user
            ->leftJoin('task_assignees', function ($join) {
                $join->on('users.id', '=', 'task_assignees.assignee_id');
            })
            ->leftJoin('tasks', function ($join) {
                $join->on('tasks.id', '=', 'task_assignees.task_id')
                    ->where('tasks.organization_id', $this->organization_id);
            })
            ->where('users.organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('tasks.parent_id') // include only subtasks
                    ->orWhere(function ($subQuery) {
                        $subQuery->whereNull('tasks.parent_id')
                            ->whereRaw('NOT EXISTS (SELECT 1 FROM tasks t WHERE t.parent_id = tasks.id)');
                    });
            });

        $periodMeta = $this->buildPeriod($filter, null, null);
        if ($filter && isset($filter['users'])) {
            $userIds = explode(',', $filter['users']); // turns "10,9" into [10, 9]
            $query->whereIn('users.id', $userIds);
        }
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('start_date', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }
        if ($filter && isset($filter['projects'])) {
            $projectIds = explode(',', $filter['projects']); // turns "10,9" into [10, 9]
            $query->whereIn('project_id', $projectIds);
        }
        $chart_data = $query->select(
            'users.name as user',
            DB::raw('COUNT(tasks.id) as task')
        )
            ->groupBy('users.name')->get();

        // Get users with highest and lowest task load
        $highest = null;
        $lowest = null;
        foreach ($chart_data as $item) {
            if (!$highest || $item->task > $highest->task)
                $highest = $item;
            if (!$lowest || $item->task < $lowest->task)
                $lowest = $item;
        }

        $data = [
            'chart_data' => $chart_data,
            'highest' => $highest,
            'lowest' => $lowest,
            'data_count' => $taskCount,
            'filters' => $filter
        ];

        $data['__report_key'] = 'users_task_load';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $chart_data->sum('task'), null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch task activity timeline report', false, 404);
        }

        return apiResponse($data, "Users task load report fetched successfully");
    }

    // Leaderboards. Datatable
    public function performanceLeaderboard($filter)
    {
        $taskCount = $this->task->where('organization_id', $this->organization_id)->count();
        // Get all users, even without tasks, via task_assignees table relation, and get all their assigned tasks
        $query = $this->user
            ->leftJoin('task_assignees', function ($join) {
                $join->on('users.id', '=', 'task_assignees.assignee_id');
            })
            ->leftJoin('tasks', function ($join) {
                $join->on('tasks.id', '=', 'task_assignees.task_id')
                    ->where('tasks.organization_id', $this->organization_id);
            })
            ->where('users.organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('tasks.parent_id') // include only subtasks
                    ->orWhere(function ($subQuery) {
                        $subQuery->whereNull('tasks.parent_id')
                            ->whereRaw('NOT EXISTS (SELECT 1 FROM tasks t WHERE t.parent_id = tasks.id)');
                    });
            });

        $periodMeta = $this->buildPeriod($filter, null, null);
        if ($filter && isset($filter['users'])) {
            $userIds = explode(',', $filter['users']); // turns "10,9" into [10, 9]
            $query->whereIn('users.id', $userIds);
        }
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('start_date', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }
        if ($filter && isset($filter['projects'])) {
            $projectIds = explode(',', $filter['projects']); // turns "10,9" into [10, 9]
            $query->whereIn('project_id', $projectIds);
        }
        $chart_data = $query->select(
            'users.id',
            'name',
            'users.position',
            DB::raw('ROUND(AVG(tasks.performance_rating),2) as avg_performance_rating')
        )
            ->groupBy('users.id', 'name', 'users.position')
            ->orderByDesc('avg_performance_rating')
            ->limit(10)
            ->get();

        // ensure numeric types for avg_performance_rating (avoid numeric strings)
        foreach ($chart_data as $item) {
            if (isset($item->avg_performance_rating)) {
                $item->avg_performance_rating = is_null($item->avg_performance_rating) ? null : (float)$item->avg_performance_rating;
            }
        }

        $data = [
            'chart_data' => $chart_data,
            'data_count' => $taskCount,
            'filters' => $filter
        ];

        $data['__report_key'] = 'performance_leaderboard';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $chart_data->count(), null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch performance leaderboard report', false, 404);
        }

        return apiResponse($data, "Performance leaderbord fetched successfully");
    }

    // Underrun vs Overruns based on time. Bar chart multiple
    public function estimateVsActual($filter)
    {
        // Fetch overall estimate and actual time
        $query = $this->task
            ->leftJoin('categories', 'categories.id', '=', 'tasks.category_id')
            ->select(
                'categories.name as category',
                DB::raw('ROUND(SUM(time_taken - time_estimate),2) as net_difference'),
                DB::raw('ROUND(SUM(CASE WHEN time_taken > time_estimate THEN time_taken - time_estimate ELSE 0 END),2) as overrun'),
                DB::raw('ROUND(SUM(CASE WHEN time_taken < time_estimate THEN time_estimate - time_taken ELSE 0 END),2) as underrun')
            )
            ->where('tasks.organization_id', $this->organization_id)
            ->where('categories.organization_id', $this->organization_id)
            ->where(function ($query) {
                $query->whereNotNull('tasks.parent_id') // include only subtasks
                    ->orWhere(function ($subQuery) {
                        $subQuery->whereNull('tasks.parent_id')
                            ->whereRaw('NOT EXISTS (SELECT 1 FROM tasks t WHERE t.parent_id = tasks.id)');
                    });
            });

        $periodMeta = $this->buildPeriod($filter, null, null);
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('start_date', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }
        if ($filter && isset($filter['projects'])) {
            $projectIds = explode(',', $filter['projects']); // turns "10,9" into [10, 9]
            $query->whereIn('project_id', $projectIds);
        }
        if ($filter && isset($filter['users'])) {
            $userIds = explode(',', $filter['users']); // turns "10,9" into [10, 9]
            $query->whereHas('assignees', function ($query) use ($userIds) {
                $query->whereIn('users.id', $userIds);
            });
        }
        $chart_data = $query->groupBy('categories.name')
            ->get();

        $runs = [
            'over' => round($chart_data->sum('overrun'), 2),
            'under' => round($chart_data->sum('underrun'), 2),
            'net' => round($chart_data->sum('percentage_difference'), 2),
        ];

        $categoryCount = count($chart_data);

        $data = [
            'chart_data' => $chart_data,
            'runs' => $runs,
            'data_count' => $categoryCount,
            'filters' => $filter
        ];

        $data['__report_key'] = 'estimate_vs_actual';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $categoryCount, null);

        if (empty($data)) {
            return apiResponse(null, 'Failed to fetch estimate vs actual report', false, 404);
        }

        return apiResponse($data, "Estimate vs actual report fetched successfully");
    }

    /* ------------------------------ DELAY REASON REPORTS ------------------------------ */

    // Delays breakdown by reason - Bar chart
    public function delaysByReason($id = null, $filter)
    {
        $query = $this->task
            ->select(
                'delay_reasons.id',
                'delay_reasons.name',
                'delay_reasons.category',
                'delay_reasons.impact_level',
                'delay_reasons.severity',
                DB::raw('COUNT(tasks.id) as task_count'),
                DB::raw('AVG(tasks.delay_days) as avg_delay_days'),
                DB::raw('SUM(tasks.delay_days) as total_delay_days'),
                DB::raw('MAX(tasks.delay_days) as max_delay_days'),
                DB::raw('MIN(tasks.delay_days) as min_delay_days')
            )
            ->leftJoin('delay_reasons', 'tasks.delay_reason_id', '=', 'delay_reasons.id')
            ->where('tasks.organization_id', $this->organization_id)
            ->where('tasks.delay', '=', 1)
            ->whereNotNull('tasks.delay_reason_id');

        $query = $this->applyFilters($query, $id, $filter);

        $periodMeta = $this->buildPeriod($filter, null, null);
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('tasks.updated_at', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }

        $chart_data = $query->groupBy(
            'delay_reasons.id',
            'delay_reasons.name',
            'delay_reasons.category',
            'delay_reasons.impact_level',
            'delay_reasons.severity'
        )
            // ->orderByDesc('task_count')
            ->get();

        $totalDelayedTasks = (clone $query)->count();
        $totalDelayDays = $chart_data->sum('total_delay_days');
        $avgDelayDays = $totalDelayedTasks > 0 ? round($totalDelayDays / $totalDelayedTasks, 2) : 0;

        $data = [
            'chart_data' => $chart_data,
            'summary_stats' => [
                'total_delayed_tasks' => $totalDelayedTasks,
                'total_delay_days' => round($totalDelayDays, 2),
                'average_delay_days' => $avgDelayDays,
                'reasons_count' => $chart_data->count(),
            ],
            'data_count' => $chart_data->count(),
        ];

        $data['__report_key'] = 'delays_by_reason';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $totalDelayedTasks, null);

        if (empty($chart_data)) {
            return apiResponse($data, "No delays recorded for selected period");
        }

        return apiResponse($data, "Delays by reason report fetched successfully");
    }

    // Delay reasons impact analysis - grouped by severity and impact level
    public function delayReasonsImpactAnalysis($id = null, $filter)
    {
        $query = $this->task
            ->select(
                'delay_reasons.id',
                'delay_reasons.name',
                'delay_reasons.category',
                'delay_reasons.impact_level',
                'delay_reasons.severity',
                DB::raw('COUNT(tasks.id) as affected_tasks'),
                DB::raw('SUM(tasks.delay_days) as total_impact_days'),
                DB::raw('AVG(tasks.delay_days) as avg_impact_days')
            )
            ->leftJoin('delay_reasons', 'tasks.delay_reason_id', '=', 'delay_reasons.id')
            ->where('tasks.organization_id', $this->organization_id)
            ->where('tasks.delay', '=', 1)
            ->whereNotNull('tasks.delay_reason_id');

        $query = $this->applyFilters($query, $id, $filter);

        $periodMeta = $this->buildPeriod($filter, null, null);
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('tasks.updated_at', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }

        $reasonData = $query->groupBy(
            'delay_reasons.id',
            'delay_reasons.name',
            'delay_reasons.category',
            'delay_reasons.impact_level',
            'delay_reasons.severity'
        )
            ->orderBy('total_impact_days', 'DESC')
            ->get();

        // Group by severity level
        $bySeverity = $reasonData->groupBy('severity')->map(function ($group) {
            return [
                'count' => $group->count(),
                'total_tasks' => $group->sum('affected_tasks'),
                'total_impact_days' => round($group->sum('total_impact_days'), 2),
                'reasons' => $group->toArray()
            ];
        });

        // Group by impact level
        $byImpactLevel = $reasonData->groupBy('impact_level')->map(function ($group) {
            return [
                'count' => $group->count(),
                'total_tasks' => $group->sum('affected_tasks'),
                'total_impact_days' => round($group->sum('total_impact_days'), 2),
                'reasons' => $group->toArray()
            ];
        });

        // Calculate impact score (combination of frequency and severity)
        $impactScores = $reasonData->map(function ($reason) {
            $severityWeight = match ($reason->severity) {
                'critical' => 5,
                'high' => 3,
                'medium' => 2,
                'low' => 1,
                default => 0
            };
            $impactWeight = match ($reason->impact_level) {
                'high' => 1.5,
                'medium' => 1.0,
                'low' => 0.5,
                default => 0
            };
            return (object)[
                'id' => $reason->id,
                'name' => $reason->name,
                'category' => $reason->category,
                'severity' => $reason->severity,
                'impact_level' => $reason->impact_level,
                'affected_tasks' => $reason->affected_tasks,
                'total_impact_days' => $reason->total_impact_days,
                'impact_score' => round($reason->affected_tasks * $severityWeight * $impactWeight, 2)
            ];
        })->sortByDesc('impact_score')->values();

        $totalDelayedTasks = $reasonData->sum('affected_tasks');
        $totalDelayDays = $reasonData->sum('total_impact_days');

        $data = [
            'by_severity' => $bySeverity,
            'by_impact_level' => $byImpactLevel,
            'impact_scores' => $impactScores,
            'summary_stats' => [
                'total_delayed_tasks' => $totalDelayedTasks,
                'total_delay_days' => round($totalDelayDays, 2),
                'unique_reasons' => $reasonData->count(),
                'critical_reasons' => $reasonData->where('severity', 'critical')->count(),
                'high_impact_reasons' => $reasonData->where('impact_level', 'high')->count(),
            ],
            'data_count' => $reasonData->count(),
        ];

        $data['__report_key'] = 'delay_reasons_impact_analysis';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $totalDelayedTasks, null);

        if (empty($reasonData)) {
            return apiResponse($data, "No delay reasons data available for analysis");
        }

        return apiResponse($data, "Delay reasons impact analysis report fetched successfully");
    }

    // Delay reasons trending over time - Line chart
    public function delayReasonsTrend($id = null, $variant = "", $filter)
    {
        $periodMeta = $this->buildPeriod($filter, 'months', 6);
        $aggregation = $periodMeta['aggregation'] ?? 'month';

        $query = $this->task
            ->select(
                DB::raw('DATE_FORMAT(tasks.updated_at, \'%Y-%m\') as period'),
                'delay_reasons.id as reason_id',
                'delay_reasons.name as reason_name',
                'delay_reasons.category as reason_category',
                DB::raw('COUNT(tasks.id) as task_count'),
                DB::raw('SUM(tasks.delay_days) as total_delay_days')
            )
            ->leftJoin('delay_reasons', 'tasks.delay_reason_id', '=', 'delay_reasons.id')
            ->where('tasks.organization_id', $this->organization_id)
            ->where('tasks.delay', '=', 1)
            ->whereNotNull('tasks.delay_reason_id');

        $query = $this->applyFilters($query, ($variant !== 'dashboard' ? $id : null), ($variant === 'dashboard' ? $filter : null));

        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('tasks.updated_at', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }

        $chart_data = $query->groupBy('period', 'delay_reasons.id', 'delay_reasons.name', 'delay_reasons.category')
            ->orderBy('period', 'ASC')
            ->get();

        // Pivot data for line chart (by reason over time)
        $trendByReason = [];
        $topReasons = $chart_data->pluck('reason_name')->unique()->take(10);

        foreach ($topReasons as $reason) {
            $reasonData = $chart_data->where('reason_name', $reason)->sortBy('period');
            $trendByReason[] = [
                'name' => $reason,
                'data' => $reasonData->map(fn($d) => [
                    'period' => $d->period,
                    'count' => $d->task_count,
                    'delay_days' => $d->total_delay_days
                ])->toArray()
            ];
        }

        $totalTasks = $chart_data->sum('task_count');
        $totalDelayDays = $chart_data->sum('total_delay_days');

        $data = [
            'chart_data' => $trendByReason,
            'summary_stats' => [
                'period_total_tasks' => $totalTasks,
                'period_total_delay_days' => round($totalDelayDays, 2),
                'tracked_reasons' => count($trendByReason),
            ],
            'data_count' => count($trendByReason),
        ];

        $data['__report_key'] = 'delay_reasons_trend';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $totalTasks, null);

        if (empty($chart_data)) {
            return apiResponse($data, "No trending data available for selected period");
        }

        return apiResponse($data, "Delay reasons trending report fetched successfully");
    }

    // Delay reasons category distribution - Pie/Donut chart
    public function delayReasonsDistribution($id = null, $filter)
    {
        $query = $this->task
            ->select(
                'delay_reasons.category',
                DB::raw('COUNT(tasks.id) as task_count'),
                DB::raw('SUM(tasks.delay_days) as total_delay_days'),
                DB::raw('AVG(tasks.delay_days) as avg_delay_days')
            )
            ->leftJoin('delay_reasons', 'tasks.delay_reason_id', '=', 'delay_reasons.id')
            ->where('tasks.organization_id', $this->organization_id)
            ->where('tasks.delay', '=', 1)
            ->whereNotNull('tasks.delay_reason_id')
            ->whereNotNull('delay_reasons.category');

        $query = $this->applyFilters($query, $id, $filter);

        $periodMeta = $this->buildPeriod($filter, null, null);
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('tasks.updated_at', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }

        $chart_data = $query->groupBy('delay_reasons.category')
            ->orderBy('task_count', 'DESC')
            ->get();

        $totalTasks = $chart_data->sum('task_count');
        $totalDelayDays = $chart_data->sum('total_delay_days');

        // Enhance with percentages
        $chart_data = $chart_data->map(function ($item) use ($totalTasks) {
            return (object)[
                'category' => $item->category ?? 'Uncategorized',
                'task_count' => $item->task_count,
                'total_delay_days' => round($item->total_delay_days, 2),
                'avg_delay_days' => round($item->avg_delay_days, 2),
                'percentage' => $totalTasks > 0 ? round(($item->task_count / $totalTasks) * 100, 2) : 0
            ];
        });

        $data = [
            'chart_data' => $chart_data,
            'summary_stats' => [
                'total_delayed_tasks' => $totalTasks,
                'total_delay_days' => round($totalDelayDays, 2),
                'categories_count' => $chart_data->count(),
                'average_delay_days' => $totalTasks > 0 ? round($totalDelayDays / $totalTasks, 2) : 0,
            ],
            'data_count' => $chart_data->count(),
        ];

        $data['__report_key'] = 'delay_reasons_distribution';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $totalTasks, null);

        if (empty($chart_data)) {
            return apiResponse($data, "No delay reason categories found");
        }

        return apiResponse($data, "Delay reasons distribution report fetched successfully");
    }

    // Top delay reasons comparison - detailed breakdown
    public function topDelayReasonsComparison($id = null, $limit = 10, $filter)
    {
        $query = $this->task
            ->select(
                'delay_reasons.id',
                'delay_reasons.name',
                'delay_reasons.category',
                'delay_reasons.impact_level',
                'delay_reasons.severity',
                'delay_reasons.description',
                DB::raw('COUNT(DISTINCT tasks.id) as task_count'),
                DB::raw('COUNT(DISTINCT tasks.project_id) as affected_projects'),
                // DB::raw('COUNT(DISTINCT tasks.user_id) as affected_users'),
                DB::raw('SUM(tasks.delay_days) as total_delay_days'),
                DB::raw('AVG(tasks.delay_days) as avg_delay_days'),
                DB::raw('MAX(tasks.delay_days) as max_delay_days'),
                DB::raw('MIN(tasks.delay_days) as min_delay_days')
            )
            ->leftJoin('delay_reasons', 'tasks.delay_reason_id', '=', 'delay_reasons.id')
            ->where('tasks.organization_id', $this->organization_id)
            ->where('tasks.delay', '=', 1)
            ->whereNotNull('tasks.delay_reason_id');

        $query = $this->applyFilters($query, $id, $filter);

        $periodMeta = $this->buildPeriod($filter, null, null);
        if (isset($periodMeta['period']['from']) && isset($periodMeta['period']['to'])) {
            $query->whereBetween('tasks.updated_at', [$periodMeta['period']['from'], $periodMeta['period']['to']]);
        }

        $chart_data = $query->groupBy(
            'delay_reasons.id',
            'delay_reasons.name',
            'delay_reasons.category',
            'delay_reasons.impact_level',
            'delay_reasons.severity',
            'delay_reasons.description'
        )
            ->orderBy('task_count', 'DESC')
            ->limit($limit)
            ->get();

        // Calculate composite scores for ranking
        $chart_data = $chart_data->map(function ($reason) {
            $severityScore = match ($reason->severity) {
                'critical' => 4,
                'high' => 3,
                'medium' => 2,
                'low' => 1,
                default => 0
            };
            $impactScore = match ($reason->impact_level) {
                'high' => 3,
                'medium' => 2,
                'low' => 1,
                default => 0
            };
            $frequencyScore = $reason->task_count;

            $compositeScore = round(($frequencyScore * 0.4) + ($severityScore * 0.35) + ($impactScore * 0.25), 2);

            return (object)[
                'id' => $reason->id,
                'name' => $reason->name,
                'category' => $reason->category,
                'severity' => $reason->severity,
                'impact_level' => $reason->impact_level,
                'description' => $reason->description,
                'task_count' => $reason->task_count,
                'affected_projects' => $reason->affected_projects,
                'affected_users' => $reason->affected_users,
                'total_delay_days' => round($reason->total_delay_days, 2),
                'avg_delay_days' => round($reason->avg_delay_days, 2),
                'max_delay_days' => round($reason->max_delay_days, 2),
                'min_delay_days' => round($reason->min_delay_days, 2),
                'composite_priority_score' => $compositeScore
            ];
        })->sortByDesc('composite_priority_score')->values();

        $totalDelayedTasks = $chart_data->sum('task_count');
        $totalDelayDays = $chart_data->sum('total_delay_days');

        $data = [
            'chart_data' => $chart_data,
            'summary_stats' => [
                'total_delayed_tasks' => $totalDelayedTasks,
                'total_delay_days' => round($totalDelayDays, 2),
                'top_reasons_shown' => $chart_data->count(),
                'avg_delay_days' => $totalDelayedTasks > 0 ? round($totalDelayDays / $totalDelayedTasks, 2) : 0,
            ],
            'data_count' => $chart_data->count(),
        ];

        $data['__report_key'] = 'top_delay_reasons_comparison';
        $data = $this->attachMetadata($data, $filter, $periodMeta, $totalDelayedTasks, null);

        if (empty($chart_data)) {
            return apiResponse($data, "No delay reasons found for comparison");
        }

        return apiResponse($data, "Top delay reasons comparison report fetched successfully");
    }
}
