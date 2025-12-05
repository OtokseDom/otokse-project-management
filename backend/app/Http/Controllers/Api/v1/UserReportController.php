<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Http\Request;

class UserReportController extends Controller
{
    protected ReportService $report_service;
    public function __construct(ReportService $report_service)
    {
        $this->report_service = $report_service;
    }
    public function userReports($id, Request $request)
    {
        $filter = $request->all();
        if (!is_numeric($id)) {
            return apiResponse('', 'Invalid user ID', false, 400);
        }

        $reports = [
            // Work output / timeline
            'tasks_completed_per_user' => $this->report_service->tasksCompletedPerUser($id, "", $filter),
            'tasks_completed_last_7_days' => $this->report_service->tasksCompletedLast7Days($id, "", $filter),
            'tasks_completed_last_6_weeks' => $this->report_service->tasksCompletedLast6Weeks($id, "", $filter),
            'tasks_completed_last_6_months' => $this->report_service->tasksCompletedLast6Months($id, "", $filter),

            // Status / delay / activity
            'tasks_by_status' => $this->report_service->tasksByStatus($id, "", $filter),
            'delay_per_user' => $this->report_service->delaysPerUser($id, $filter), // optional, may be helpful

            // User-specific reports
            'task_activity_timeline' => $this->report_service->taskActivityTimeline($id, $filter),
            'rating_per_category' => $this->report_service->ratingPerCategory($id, $filter),
            'performance_rating_trend' => $this->report_service->performanceRatingTrend($id, "", $filter),
            'completion_velocity' => $this->report_service->completionVelocityTrend($id, "", $filter),
            'estimate_vs_actual' => $this->report_service->userEstimateVsActual($id, $filter),

            // Summary cards / progress
            'section_cards' => $this->report_service->sectionCards($id, $filter),
            'overall_progress' => $this->report_service->overallProgress($id, $filter),

            // A user_tasks entry so frontend can read filters/date range for task list (reuse a report that includes filters)
            'user_tasks' => $this->report_service->tasksCompletedPerUser($id, "", $filter),
        ];

        $data = [];

        foreach ($reports as $key => $report) {
            $payload = $report->getData(true);
            $data[$key] = $payload['success'] ? $payload['data'] : null;
        }
        return apiResponse($data, 'Reports fetched successfully');
    }
}
