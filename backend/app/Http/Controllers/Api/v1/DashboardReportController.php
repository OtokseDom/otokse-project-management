<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

class DashboardReportController extends Controller
{

    protected ReportService $report_service;
    public function __construct(ReportService $report_service)
    {
        $this->report_service = $report_service;
    }
    public function dashboardReports(Request $request)
    {
        $filter = $request->all();
        $reports = [
            'tasks_completed_per_user' => $this->report_service->tasksCompletedPerUser(null, "dashboard", $filter),
            'tasks_completed_last_7_days' => $this->report_service->tasksCompletedLast7Days(null, "dashboard", $filter),
            'tasks_completed_last_6_weeks' => $this->report_service->tasksCompletedLast6Weeks(null, "dashboard", $filter),
            'tasks_completed_last_6_months' => $this->report_service->tasksCompletedLast6Months(null, "dashboard", $filter),
            'tasks_by_status' => $this->report_service->tasksByStatus(null, "dashboard", $filter),
            'users_task_load' => $this->report_service->usersTaskLoad($filter),
            'estimate_vs_actual' => $this->report_service->estimateVsActual($filter),
            'estimate_vs_actual_date' => $this->report_service->estimateVsActualDate(null, $filter),
            'delay_per_user' => $this->report_service->delaysPerUser(null, $filter),
            'overrun_underrun_ratio' => $this->report_service->overrunUnderrunRatio(null, 'dashboard', $filter),
            'performance_leaderboard' => $this->report_service->performanceLeaderboard($filter),
            'performance_rating_trend' => $this->report_service->performanceRatingTrend(null, "dashboard", $filter),
            'completion_velocity' => $this->report_service->completionVelocityTrend(null, "dashboard", $filter),
            'section_cards' => $this->report_service->sectionCards(null, $filter),
            'overall_progress' => $this->report_service->overallProgress(null, $filter),
        ];

        $data = [];
        // Mass check data for success response on each function
        foreach ($reports as $key => $report) {
            $payload = $report->getData(true);
            $data[$key] = $payload['success'] ? $payload['data'] : null;
        }

        return apiResponse($data, 'Reports fetched successfully');
    }
}
