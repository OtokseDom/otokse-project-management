import { useEffect, useState } from "react";
import axiosClient from "@/axios.client";
import { SectionCard } from "@/components/chart/section-card";
import { PieChartDonut } from "@/components/chart/pie-chart-donut";
import { ChartPieLabel } from "@/components/chart/pie-chart-label";
import { ChartBarMultiple } from "@/components/chart/bar-chart-multiple";
import { ChartBarHorizontal } from "@/components/chart/chart-bar-horizontal";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLineLabel } from "@/components/chart/line-chart-label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FilterForm from "../../components/form/filter-form";
import FilterTags from "@/components/form/FilterTags";
import { API } from "@/constants/api";
import GalaxyProgressBar from "@/components/design/GalaxyProgressBar";
// Zustand centralized store
import { useUsersStore } from "@/store/users/usersStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { ChartBarLabel } from "@/components/chart/bar-chart-label";

// TODO: Export report with filter
// TODO: Notification
export default function UserProfile() {
	const { users } = useUsersStore();
	const { projects, projectsLoaded } = useProjectsStore();
	const {
		reports,
		setReports,
		userFilter,
		projectFilter,
		filters,
		setFilters,
		selectedProjects,
		setSelectedProjects,
		selectedUsers,
		setSelectedUsers,
		dashboardReportsLoading,
		setDashboardReportsLoading,
	} = useDashboardStore();
	// Fetch Hooks
	const { fetchProjects, fetchUsers, fetchReports } = useTaskHelpers();

	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		document.title = "Task Management";
		if (!reports || Object.keys(reports).length === 0) fetchReports();
		if (!users || users.length === 0) fetchUsers();
		if ((!projects || projects.length === 0) && !projectsLoaded) fetchProjects();
	}, []);

	const handleRemoveFilter = async (key) => {
		// Deep copy filters to avoid mutating state directly
		const updated = {
			values: { ...filters.values },
			display: { ...filters.display },
		};
		updated.values[key] = "";
		updated.display[key] = "";
		setFilters(updated);
		const from = updated.values["Date Range"] ? updated.values["Date Range"]?.split(" to ")[0] : "";
		const to = updated.values["Date Range"] ? updated.values["Date Range"]?.split(" to ")[1] : "";
		const projects = updated.values["Projects"] ?? "";
		const members = updated.values["Members"] ?? "";
		setDashboardReportsLoading(true);
		try {
			// Fetch all reports in one call
			const reportsRes = await axiosClient.get(API().dashboard(from, to, members, projects));
			setReports(reportsRes.data.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setDashboardReportsLoading(false);
		}
	};

	// Section Title Component
	const SectionTitle = ({ children, icon }) => (
		<div className="md:col-span-12 mt-6 mb-2">
			<h2 className="text-xl font-bold flex items-center gap-2 text-foreground border-b border-border pb-2">
				{icon && <span>{icon}</span>}
				{children}
			</h2>
		</div>
	);

	// Placeholder Chart Component
	const PlaceholderChart = ({ title }) => (
		<div className="bg-background text-card-foreground border border-border rounded-2xl p-6 shadow-md flex items-center justify-center min-h-[300px]">
			<div className="text-center">
				<div className="text-4xl mb-2">📊</div>
				<div className="text-lg font-semibold text-muted-foreground">{title}</div>
				<div className="text-sm text-muted-foreground mt-1">Coming Soon</div>
			</div>
		</div>
	);

	return (
		<div className="w-screen md:w-fit container p-5 md:p-0 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4 auto-rows-auto ">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			<div className="md:col-span-12">
				<div className="flex flex-col md:flex-row justify-between gap-6 md:items-center">
					<div className="">
						<h1 className="font-extrabold text-3xl">Dashboard</h1>
						<p>Your workspace at a glance</p>
					</div>
					<div className="flex flex-row gap-2">
						<Dialog modal={false} open={isOpen} onOpenChange={setIsOpen}>
							<DialogTrigger asChild>{!dashboardReportsLoading && <Button variant="default">Filter</Button>}</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Select filter</DialogTitle>
									<DialogDescription>Apply available filters to view specific reports</DialogDescription>
								</DialogHeader>
								<FilterForm
									setIsOpen={setIsOpen}
									setReports={setReports}
									filters={filters}
									setFilters={setFilters}
									projects={projectFilter}
									users={userFilter}
									selectedProjects={selectedProjects}
									setSelectedProjects={setSelectedProjects}
									selectedUsers={selectedUsers}
									setSelectedUsers={setSelectedUsers}
								/>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</div>
			<div className="md:col-span-12 flex flex-wrap justify-end gap-2">
				<FilterTags filters={filters.display} onRemove={handleRemoveFilter} />
			</div>

			{/* Overall Progress */}
			<div className="md:col-span-12 w-full">
				<GalaxyProgressBar
					progress={reports?.overall_progress?.progress}
					label={
						reports?.overall_progress?.filters && !Object.values(reports.overall_progress.filters).every((value) => value === null)
							? "Overall Progress (Filtered)"
							: "Overall Progress (All Time)"
					}
					variant="dashboard"
					className="w-full"
				/>
			</div>

			{/* ========================================== */}
			{/* 3️⃣ TIMELINESS & DELAY METRICS */}
			{/* ========================================== */}
			<SectionTitle icon="⌛">Timeliness & Delay Metrics</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12 overflow-auto">
				<SectionCard
					description="Avg Completion Rate"
					showBadge={false}
					tooltip={`% of tasks with status = "Completed"`}
					value={`${reports?.section_cards?.completion_rate}%`}
					variant="dashboard"
				/>
				<SectionCard
					description="Avg Delayed Days"
					showBadge={false}
					tooltip={`Avg number of "Days Delayed" for tasks with status != "Cancelled"`}
					value={`${reports?.section_cards?.average_delay_days} days`}
					variant="dashboard"
				/>
				<SectionCard
					description="Total Delayed Days"
					showBadge={false}
					tooltip={`Total number of "Days Delayed" for tasks with status != "Cancelled"`}
					value={`${reports?.section_cards?.total_delay_days} days`}
					variant="dashboard"
				/>
				<SectionCard
					description="Delay Frequency %"
					showBadge={false}
					tooltip={`Percentage of tasks with "Days Delayed" > 0 and with status != "Cancelled"`}
					value={`${reports?.section_cards?.delay_frequency_percentage}%`}
					variant="dashboard"
				/>
			</div>

			<div className="md:col-span-4">
				<PieChartDonut report={reports?.tasks_by_status} variant="dashboard" />
			</div>

			<div className="md:col-span-4">
				<ChartBarLabel report={reports?.delay_per_user} variant="delay" />
			</div>

			<div className="md:col-span-4">
				<PlaceholderChart title="Projected Delay for Ongoing Tasks" />
			</div>

			{/* ========================================== */}
			{/* 1️⃣ WORK OUTPUT & VOLUME */}
			{/* ========================================== */}
			<SectionTitle icon="🫙">Work Output & Volume</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12 overflow-auto">
				<SectionCard
					description="Avg Tasks Completed per Day"
					showBadge={false}
					tooltip={`Avg tasks per day with status = "Completed"`}
					value={`${reports?.section_cards?.average_tasks_completed_per_day} tasks`}
					variant="dashboard"
				/>
				<SectionCard description="📊 Subtasks per Parent Task" showBadge={false} value="Coming Soon" variant="dashboard" />
			</div>

			<div className="md:col-span-4">
				<ChartBarLabel
					variant="tasks_completed"
					report={reports?.tasks_completed_last_7_days}
					config={{
						title: "Tasks Completed (Last 7 Days)",
						labelKey: "label",
						valueKey: "tasks_completed",
						color: "hsl(140 70% 50%)", // Green
						total: reports?.tasks_completed_last_7_days?.total_tasks,
					}}
				/>
			</div>
			<div className="md:col-span-4">
				<ChartBarLabel
					variant="tasks_completed"
					report={reports?.tasks_completed_last_6_weeks}
					config={{
						title: "Tasks Completed (Last 6 Weeks)",
						labelKey: "label",
						valueKey: "tasks_completed",
						color: "hsl(45 90% 55%)", // Yellow
						total: reports?.tasks_completed_last_6_weeks?.total_tasks,
					}}
				/>
			</div>
			<div className="md:col-span-4">
				<ChartBarLabel
					variant="tasks_completed"
					report={reports?.tasks_completed_last_6_months}
					config={{
						title: "Tasks Completed (Last 6 Months)",
						labelKey: "label",
						valueKey: "tasks_completed",
						color: "hsl(200 80% 55%)", // Blue
						total: reports?.tasks_completed_last_6_months?.total_tasks,
					}}
				/>
			</div>

			<div className="md:col-span-6">
				<ChartBarHorizontal report={reports?.tasks_completed_per_user} title="Tasks Completed per User" />
			</div>

			<div className="md:col-span-6">
				<PlaceholderChart title="Completion Velocity Trend" />
			</div>

			{/* ========================================== */}
			{/* 2️⃣ EFFICIENCY METRICS */}
			{/* ========================================== */}
			<SectionTitle icon="🌟">Efficiency Metrics</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12 overflow-auto">
				<SectionCard
					description="Avg Time Efficiency"
					showBadge={false}
					tooltip={`(time estimate / time taken) * 100 of tasks with status = "Completed"`}
					value={`${reports?.section_cards?.time_efficiency}%`}
					variant="dashboard"
				/>
				<SectionCard
					description="Avg Days Taken per Task"
					showBadge={false}
					tooltip={`Avg "Days Taken" of tasks with status = "Completed"`}
					value={`${reports?.section_cards?.average_days_per_task} days`}
					variant="dashboard"
				/>
				<SectionCard
					description="Tasks Completed Ahead of Schedule"
					showBadge={false}
					tooltip={`Total count of tasks where "Actual Date" < "End Date" AND status = "Completed"`}
					value={`${reports?.section_cards?.tasks_ahead_of_schedule} tasks`}
					variant="dashboard"
				/>
			</div>

			<div className="md:col-span-6">
				<ChartBarMultiple report={reports?.estimate_vs_actual_date} variant="dashboard" type={"user"} />
			</div>

			<div className="md:col-span-6">
				<ChartPieLabel report={reports?.overrun_underrun_ratio} title={"Overrun / Underrun Ratio"} />
			</div>

			<div className="md:col-span-6">
				<PlaceholderChart title="Avg Time per Category/Project" />
			</div>

			{/* ========================================== */}
			{/* 4️⃣ QUALITY & CONSISTENCY METRICS */}
			{/* ========================================== */}
			<SectionTitle icon="💯">Quality & Consistency Metrics</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12 overflow-auto">
				<SectionCard
					description="Members Avg Performance (5)"
					showBadge={false}
					tooltip={`Avg "Performance Rating" of all tasks for all members`}
					value={reports?.section_cards?.avg_performance}
					variant="dashboard"
				/>
				<SectionCard description="📊 Performance Variance" showBadge={false} value="Coming Soon" variant="dashboard" />
			</div>

			<div className="md:col-span-6">
				<ChartLineLabel report={reports?.performance_rating_trend} variant="dashboard" title="Performance Trends" metricLabel="Performance Rating" />
			</div>

			<div className="md:col-span-6">
				<ChartLineLabel report={reports?.completion_velocity} variant="dashboard" title="Completion Velocity" metricLabel="Completion Rate (%)" />
			</div>

			{/* ========================================== */}
			{/* 5️⃣ WORKLOAD & BALANCE METRICS */}
			{/* ========================================== */}
			<SectionTitle icon="💪">Workload & Balance Metrics</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12 overflow-auto">
				<SectionCard description="📊 Avg Estimated Days per User" showBadge={false} value="Coming Soon" variant="dashboard" />
				<SectionCard description="📊 Avg Actual Days per User" showBadge={false} value="Coming Soon" variant="dashboard" />
				<SectionCard description="📊 Workload Balance Index" showBadge={false} value="Coming Soon" variant="dashboard" />
				<SectionCard description="📊 Utilization Rate" showBadge={false} value="Coming Soon" variant="dashboard" />
			</div>

			<div className="md:col-span-6">
				<ChartBarHorizontal report={reports?.users_task_load} variant="dashboard" title="User Task Load" />
			</div>

			<div className="md:col-span-6">
				<PlaceholderChart title="Active Tasks per User" />
			</div>

			{/* ========================================== */}
			{/* 6️⃣ TREND & PROGRESS METRICS */}
			{/* ========================================== */}
			<SectionTitle icon="📈">Trend & Progress Metrics</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12 overflow-auto">
				<SectionCard description="📊 Productivity Trend (WoW)" showBadge={false} value="Coming Soon" variant="dashboard" />
				<SectionCard description="📊 Delay Trend Status" showBadge={false} value="Coming Soon" variant="dashboard" />
			</div>

			<div className="md:col-span-6">
				<PlaceholderChart title="Performance Trend by Month" />
			</div>

			<div className="md:col-span-6">
				<PlaceholderChart title="Velocity Trend per Project/Team" />
			</div>

			{/* ========================================== */}
			{/* 7️⃣ COMPARATIVE METRICS */}
			{/* ========================================== */}
			<SectionTitle icon="📊">Comparative Metrics</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12 overflow-auto">
				<SectionCard description="📊 Most Improved Users" showBadge={false} value="Coming Soon" variant="dashboard" />
			</div>

			<div className="md:col-span-4">
				<PlaceholderChart title="User Efficiency Ranking" />
			</div>

			<div className="md:col-span-4">
				<PlaceholderChart title="Category Efficiency Comparison" />
			</div>

			<div className="md:col-span-4 max-h-[600px] overflow-auto scrollbar-custom bg-background text-card-foreground border border-border rounded-2xl container px-4 shadow-md">
				<CardHeader className="text-center">
					<CardTitle className="text-lg">
						{reports?.performance_leaderboard?.filters?.from && reports?.performance_leaderboard?.filters?.to
							? `${new Date(reports.performance_leaderboard.filters.from).toLocaleDateString("en-CA", {
									month: "short",
									day: "numeric",
									year: "numeric",
							  })} - ${new Date(reports.performance_leaderboard.filters.to).toLocaleDateString("en-CA", {
									month: "short",
									day: "numeric",
									year: "numeric",
							  })}`
							: "All Time"}{" "}
						Top Performers
					</CardTitle>
					<CardDescription>
						Showing{" "}
						{reports?.performance_leaderboard?.chart_data?.length == 1
							? "(Top 1) user"
							: reports?.performance_leaderboard?.chart_data?.length > 1
							? "(Top " + reports?.performance_leaderboard?.chart_data?.length + ") users"
							: ""}
					</CardDescription>
				</CardHeader>
				{reports?.performance_leaderboard?.data_count ? (
					<DataTable columns={columns} data={reports?.performance_leaderboard?.chart_data} />
				) : (
					<div className="flex items-center justify-center fw-full h-full max-h-44 text-lg text-gray-500">No Tasks Yet</div>
				)}
			</div>
		</div>
	);
}
