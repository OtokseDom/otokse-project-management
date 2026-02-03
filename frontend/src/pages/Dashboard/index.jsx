import { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/axios.client";
import { SectionCard } from "@/components/chart/section-card";
import { PieChartDonut } from "@/components/chart/pie-chart-donut";
import { ChartPieLabel } from "@/components/chart/pie-chart-label";
import { ChartBarMultiple } from "@/components/chart/bar-chart-multiple";
import { ChartBarHorizontal } from "@/components/chart/chart-bar-horizontal";
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
import { useEpicHelpers } from "@/utils/epicHelpers";
import { useEpicsStore } from "@/store/epics/epicsStore";
import { Filter } from "lucide-react";

// TODO: Feat - Low - Export report with filter
// TODO: Feat - Low - Notification
// TODO: Urgent - Refactor components to reduce repetition
const FILTER_KEYS = {
	DATE_RANGE: "Date Range",
	MEMBERS: "Members",
	PROJECTS: "Projects",
	EPICS: "Epics",
};

const buildDashboardParams = (filtersValues) => {
	const dateRange = filtersValues?.[FILTER_KEYS.DATE_RANGE] ?? "";
	const [from = "", to = ""] = dateRange ? dateRange.split(" to ") : [];

	return {
		from,
		to,
		members: filtersValues?.[FILTER_KEYS.MEMBERS] ?? "",
		projects: filtersValues?.[FILTER_KEYS.PROJECTS] ?? "",
		epics: filtersValues?.[FILTER_KEYS.EPICS] ?? "",
	};
};

const SectionTitle = ({ children }) => (
	<div className="md:col-span-12 mt-6 mb-2">
		<h2 className="text-xl font-bold flex items-center gap-2 text-foreground border-b border-border pb-2">{children}</h2>
	</div>
);

export default function Dashboard() {
	const { users } = useUsersStore();
	const { projects, projectsLoaded } = useProjectsStore();
	const { epics, epicsLoaded } = useEpicsStore();
	const {
		reports,
		setReports,
		filters,
		setFilters,
		dashboardReportsLoading,
		setDashboardReportsLoading,
		// Users
		userFilter,
		selectedUsers,
		setSelectedUsers,
		// Projects
		projectFilter,
		selectedProjects,
		setSelectedProjects,
		// Epics
		epicFilter,
		selectedEpics,
		setSelectedEpics,
	} = useDashboardStore();
	// Fetch Hooks
	const { fetchProjects, fetchUsers, fetchReports } = useTaskHelpers();
	const { fetchEpics } = useEpicHelpers();

	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		document.title = "Task Management";
		// Initial load uses the store to avoid redundant API calls.
		if (!reports || Object.keys(reports).length === 0) fetchReports();
		if (!users || users.length === 0) fetchUsers();
		if ((!projects || projects.length === 0) && !projectsLoaded) fetchProjects();
		if ((!epics || epics.length === 0) && !epicsLoaded) fetchEpics();
	}, [epics, epicsLoaded, fetchEpics, fetchProjects, fetchReports, fetchUsers, projects, projectsLoaded, reports, users]);

	const fetchDashboardReports = useCallback(
		async (filtersValues) => {
			const { from, to, members, projects, epics } = buildDashboardParams(filtersValues);
			setDashboardReportsLoading(true);
			try {
				// Single backend request for all dashboard metrics.
				const reportsRes = await axiosClient.get(API().dashboard(from, to, members, projects, epics));
				setReports(reportsRes.data.data);
			} catch (e) {
				if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
			} finally {
				setDashboardReportsLoading(false);
			}
		},
		[setDashboardReportsLoading, setReports]
	);

	const handleRemoveFilter = useCallback(
		async (key) => {
			// Deep copy filters to avoid mutating state directly.
			const updated = {
				values: { ...filters.values },
				display: { ...filters.display },
			};
			updated.values[key] = "";
			updated.display[key] = "";
			setFilters(updated);

			if (key === FILTER_KEYS.MEMBERS) setSelectedUsers([]);
			if (key === FILTER_KEYS.PROJECTS) setSelectedProjects([]);
			if (key === FILTER_KEYS.EPICS) setSelectedEpics([]);

			await fetchDashboardReports(updated.values);
		},
		[fetchDashboardReports, filters.display, filters.values, setFilters, setSelectedEpics, setSelectedProjects, setSelectedUsers]
	);

	const overallProgressLabel = useMemo(() => {
		const reportFilters = reports?.overall_progress?.filters;
		const hasFilters = reportFilters && !Object.values(reportFilters).every((value) => value === null);
		return hasFilters ? "Overall Progress (Filtered)" : "Overall Progress (All Time)";
	}, [reports?.overall_progress?.filters]);

	return (
		<div className="w-screen md:w-fit container p-5 md:p-0 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4 auto-rows-auto">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			<div className="md:col-span-12">
				<div className="flex flex-col md:flex-row justify-between gap-6 md:items-center">
					<div>
						<h1 className="font-extrabold text-3xl">Dashboard</h1>
						<p>Your workspace at a glance</p>
					</div>
					<div className="flex flex-row gap-2">
						<Dialog modal={false} open={isOpen} onOpenChange={setIsOpen}>
							<DialogTrigger asChild>
								{!dashboardReportsLoading && (
									<Button variant="default">
										<Filter /> Filter
									</Button>
								)}
							</DialogTrigger>
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
									// Users
									users={userFilter}
									selectedUsers={selectedUsers}
									setSelectedUsers={setSelectedUsers}
									// Projects
									projects={projectFilter}
									selectedProjects={selectedProjects}
									setSelectedProjects={setSelectedProjects}
									// Epics
									epics={epicFilter}
									selectedEpics={selectedEpics}
									setSelectedEpics={setSelectedEpics}
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
				<GalaxyProgressBar progress={reports?.overall_progress?.progress} label={overallProgressLabel} variant="dashboard" className="w-full" />
			</div>

			{/* <div className="md:col-span-4">
				<PlaceholderChart title="Projected Delay for Ongoing Tasks" />
			</div> */}

			{/* ========================================== */}
			{/* 1. WORK OUTPUT & VOLUME */}
			{/* ========================================== */}
			<SectionTitle>Work Output & Volume</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12">
				<SectionCard
					description="Avg Tasks Completed per Day"
					showBadge={false}
					tooltip={`Avg tasks per day with status = "Completed"`}
					value={`${reports?.section_cards?.average_tasks_completed_per_day} tasks`}
					variant="dashboard"
				/>
				<SectionCard
					description="Subtasks per Parent Task"
					showBadge={false}
					tooltip={`Subtasks/Parent tasks`}
					value={`${reports?.section_cards?.subtasks_per_parent_task} tasks`}
					variant="dashboard"
				/>
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
				<ChartBarHorizontal report={reports?.users_task_load} variant="dashboard" title="User Task Load" />
			</div>

			{/* <div className="md:col-span-6">
				<PlaceholderChart title="Completion Velocity Trend" />
			</div> */}

			{/* ========================================== */}
			{/* 3. TIMELINESS & DELAY METRICS */}
			{/* ========================================== */}
			<SectionTitle>Timeliness & Delay Metrics</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12">
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

			{/* ========================================== */}
			{/* 2. EFFICIENCY METRICS */}
			{/* ========================================== */}
			<SectionTitle>Efficiency Metrics</SectionTitle>

			<div className="flex flex-col md:flex-row gap-4 md:col-span-12">
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

			{/* <div className="md:col-span-6">
				<PlaceholderChart title="Avg Time per Category/Project" />
			</div> */}
		</div>
	);
}
