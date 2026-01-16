import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Rows3, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import axiosClient from "@/axios.client";
import { columnsTask } from "@/pages/Tasks/List/datatable/columns";
import { DataTableTasks } from "@/pages/Tasks/List/datatable/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PieChartDonut } from "@/components/chart/pie-chart-donut";
import GalaxyProfileBanner from "@/components/design/galaxy";
import { AreaChartGradient } from "@/components/chart/area-chart-gradient";
import { RadarChartGridFilled } from "@/components/chart/radar-chart-grid-filled";
import { ChartLineLabel } from "@/components/chart/line-chart-label";
import { ChartBarMultiple } from "@/components/chart/bar-chart-multiple";
import { ChartBarLabel } from "@/components/chart/bar-chart-label";
import UserDetails from "@/pages/Users/Show/details";
import { SectionCard } from "@/components/chart/section-card";
import FilterForm from "@/components/form/filter-form";
import FilterTags from "@/components/form/FilterTags";
import { API } from "@/constants/api";
import GalaxyProgressBar from "@/components/design/GalaxyProgressBar";
import { flattenTasks, getProfileProjectProgress, useTaskHelpers } from "@/utils/taskHelpers";
import { useUsersStore } from "@/store/users/usersStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useUserStore } from "@/store/user/userStore";
import UserForm from "../form";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskForm from "../../Tasks/form.jsx";
import History from "@/components/task/History";
import Relations from "@/components/task/Relations";
import Tabs from "@/components/task/Tabs";
import { TaskDiscussions } from "@/components/task/Discussion";
import GridList from "@/pages/Tasks/List/grid/gridList";
import { Progress } from "@/components/ui/progress";
import { useEpicHelpers } from "@/utils/epicHelpers";
import { useEpicsStore } from "@/store/epics/epicsStore";

export default function UserProfile() {
	const { id } = useParams();
	const [detailsLoading, setDetailsLoading] = useState(false);
	// Stores
	const {
		user,
		setUser,
		userReports,
		setUserReports,
		profileFilters,
		setProfileFilters,
		profileSelectedProjects,
		setProfileSelectedProjects,
		profileSelectedEpics,
		setProfileSelectedEpics,
		userReportsLoading,
		setUserReportsLoading,
	} = useUserStore();
	const { projectFilter, epicFilter } = useDashboardStore();
	const { users } = useUsersStore();
	const { projects, projectsLoaded } = useProjectsStore();
	const { epics, epicsLoaded } = useEpicsStore();
	const { categories } = useCategoriesStore();
	const { tasks, tasksLoaded, setRelations, selectedTaskHistory, activeTab, setActiveTab, tasksLoading } = useTasksStore();
	const { taskStatuses } = useTaskStatusesStore();
	// Helpers
	const { fetchTasks, fetchProjects, fetchUsers, fetchCategories, fetchTaskStatuses, fetchUserReports } = useTaskHelpers();
	const { fetchEpics } = useEpicHelpers();
	// Dialogs and Sheets
	const [isOpen, setIsOpen] = useState(false);
	const [isOpenUser, setIsOpenUser] = useState(false);
	const [isOpenFilter, setIsOpenFilter] = useState(false);
	const [updateData, setUpdateData] = useState({});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	// const [dialogOpenTask, setDialogOpenTask] = useState(false);
	const [projectId, setProjectId] = useState(null); //for adding subtasks from relations tab
	const [parentId, setParentId] = useState(null);
	const [tableData, setTableData] = useState([]);
	const [view, setView] = useState(() => "grid");
	const [filteredUserTasks, setFilteredUserTasks] = useState([]);
	// For task list project filter
	const [selectedProject, setSelectedProject] = useState();

	// Filter tasks assigned to this user
	useEffect(() => {
		const filteredUserTasks = tasks.filter((task) => Array.isArray(task.assignees) && task.assignees.some((user) => user.id === parseInt(id)));
		setFilteredUserTasks(filteredUserTasks);
		setTableData(flattenTasks(filteredUserTasks));
	}, [tasks, id]);
	// Apply project filter to user tasks
	const { text: taskProgressText, value: taskProgressValue } = getProfileProjectProgress(id, selectedProject);

	useEffect(() => {
		if (selectedProject) {
			const filtered = filteredUserTasks.filter((task) => task.project_id === selectedProject.id);
			if (filtered !== null) setTableData(flattenTasks(filtered));
		} else {
			if (filteredUserTasks !== null) setTableData(flattenTasks(filteredUserTasks));
		}
	}, [tasks, selectedProject]);

	// Reset form state when sheet is closed
	useEffect(() => {
		if (!isOpen) {
			setUpdateData({});
			setRelations({});
			setActiveTab("update");
			setParentId(null);
			setProjectId(null);
		}
	}, [isOpen]);

	// Fetch necessary data on mount
	useEffect(() => {
		document.title = "Task Management | User Profile";
		if (!taskStatuses || taskStatuses.length === 0) fetchTaskStatuses();
		if (!users || users.length === 0) fetchUsers();
		if (!categories || categories.length === 0) fetchCategories();
		if ((!tasks || tasks.length === 0) && !tasksLoaded) fetchTasks();
		if ((!projects || projects.length === 0) && !projectsLoaded) fetchProjects();
		if ((!epics || epics.length === 0) && !epicsLoaded) fetchEpics();
		setProfileSelectedProjects([]);
	}, []);

	// Fetch user details and reports when ID changes
	useEffect(() => {
		if (Object.keys(user).length === 0 || parseInt(user.id) !== parseInt(id)) fetchDetails();
		if (!userReports || userReports.length === 0 || user.id != parseInt(id)) fetchUserReports(id);
	}, [id]);

	// Fetch user details function
	const fetchDetails = async () => {
		setDetailsLoading(true);
		try {
			const response = await axiosClient.get(API().user(id));
			setUser(response?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setDetailsLoading(false);
		}
	};

	// Handle removing a filter
	const handleRemoveFilter = async (key) => {
		const updated = {
			values: { ...profileFilters.values },
			display: { ...profileFilters.display },
		};
		updated.values[key] = "";
		updated.display[key] = "";
		setProfileFilters(updated);
		const from = updated.values["Date Range"] ? updated.values["Date Range"]?.split(" to ")[0] : "";
		const to = updated.values["Date Range"] ? updated.values["Date Range"]?.split(" to ")[1] : "";
		const projects = updated.values["Projects"] ?? "";
		setUserReportsLoading(true);
		try {
			const reportsRes = await axiosClient.get(API().user_reports(id, from, to, projects));
			setUserReports(reportsRes?.data?.data);
			setUserReportsLoading(false);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setUserReportsLoading(false);
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
		<div className="flex flex-col w-screen md:w-full container p-5 md:p-0 sm:text-sm -mt-10">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen || isOpenUser || isOpenFilter || dialogOpen || deleteDialogOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>

			{/* Back button */}
			<Link to="/users">
				<Button variant="ghost" className="flex items-center">
					<ArrowLeft />
				</Button>
			</Link>

			{/* User Details */}
			<GalaxyProfileBanner>
				<UserDetails setIsOpenUser={setIsOpenUser} setDetailsLoading={setDetailsLoading} detailsLoading={detailsLoading} />
			</GalaxyProfileBanner>

			{/* Update user Form Sheet */}
			<Sheet open={isOpenUser} onOpenChange={setIsOpenUser} modal={false}>
				<SheetContent side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
					<SheetHeader>
						<SheetTitle>Update User</SheetTitle>
						<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
					</SheetHeader>
					<UserForm setIsOpen={setIsOpenUser} updateData={user} userProfileId={id} />
				</SheetContent>
			</Sheet>

			{/* Main Content Grid */}
			<div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4 auto-rows-auto mt-4">
				{/* Filter Section */}
				<div className="md:col-span-12">
					<div className="flex flex-wrap justify-start items-center gap-4">
						<Dialog modal={false} open={isOpenFilter} onOpenChange={setIsOpenFilter}>
							<DialogTrigger asChild>{!userReportsLoading && <Button variant="default">Filter</Button>}</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Select filter</DialogTitle>
									<DialogDescription>Apply available filters to view specific reports</DialogDescription>
								</DialogHeader>
								<FilterForm
									setIsOpen={setIsOpenFilter}
									setReports={setUserReports}
									filters={profileFilters}
									setFilters={setProfileFilters}
									// Projects
									projects={projectFilter}
									selectedProjects={profileSelectedProjects}
									setSelectedProjects={setProfileSelectedProjects}
									// Epics
									epics={epicFilter}
									selectedEpics={profileSelectedEpics}
									setSelectedEpics={setProfileSelectedEpics}
									userId={id}
								/>
							</DialogContent>
						</Dialog>
						<FilterTags filters={profileFilters.display} onRemove={handleRemoveFilter} />
					</div>
				</div>

				{/* Overall Progress */}
				<div className="md:col-span-12 w-full">
					<GalaxyProgressBar
						progress={userReports?.overall_progress?.progress}
						label={
							userReports?.overall_progress?.filters && !Object.values(userReports.overall_progress.filters).every((value) => value === null)
								? "Overall Progress (Filtered)"
								: "Overall Progress (All Time)"
						}
						className="w-full"
					/>
				</div>

				{/* ========================================== */}
				{/* 3️⃣ TIMELINESS & DELAY METRICS */}
				{/* ========================================== */}
				<SectionTitle icon="⌛">Timeliness & Delay Metrics</SectionTitle>

				<div className="flex flex-col md:flex-row gap-4 md:col-span-12">
					<SectionCard variant="" description="Completion Rate" showBadge={false} value={`${userReports?.section_cards?.completion_rate}%`} />
					<SectionCard variant="" description="Avg Delayed Days" showBadge={false} value={userReports?.section_cards?.average_delay_days} />
					<SectionCard variant="" description="Total Project Delayed Days" showBadge={false} value={userReports?.section_cards?.total_delay_days} />
					<SectionCard variant="" description="Tasks Due Soon" showBadge={false} value={userReports?.section_cards?.task_at_risk} />
					<SectionCard description="📊 Tasks Before Deadline %" showBadge={false} value="Coming Soon" variant="" />
				</div>

				<div className="md:col-span-6">
					<PieChartDonut report={userReports?.tasks_by_status} />
				</div>

				<div className="md:col-span-6">
					<PlaceholderChart title="Projected Delay for Ongoing Tasks" />
				</div>

				{/* ========================================== */}
				{/* 1️⃣ WORK OUTPUT & VOLUME */}
				{/* ========================================== */}
				<SectionTitle icon="🫙">Work Output & Volume</SectionTitle>

				<div className="flex flex-col md:flex-row gap-4 md:col-span-12">
					<SectionCard
						description="📊 Avg Tasks Completed per Day"
						showBadge={false}
						value={`${userReports?.section_cards?.average_tasks_completed_per_day}%`}
						variant=""
					/>
					<SectionCard description="📊 Subtasks per Parent Task" showBadge={false} value="Coming Soon" variant="" />
				</div>

				<div className="md:col-span-4">
					<ChartBarLabel
						variant="tasks_completed"
						report={userReports?.tasks_completed_last_7_days}
						config={{
							title: "Tasks Completed (Last 7 Days)",
							labelKey: "label",
							valueKey: "tasks_completed",
							color: "hsl(140 70% 50%)",
							total: userReports?.tasks_completed_last_7_days?.data_count,
						}}
					/>
				</div>

				<div className="md:col-span-4">
					<ChartBarLabel
						variant="tasks_completed"
						report={userReports?.tasks_completed_last_6_weeks}
						config={{
							title: "Tasks Completed (Last 6 Weeks)",
							labelKey: "label",
							valueKey: "tasks_completed",
							color: "hsl(45 90% 55%)",
							total: userReports?.tasks_completed_last_6_weeks?.data_count,
						}}
					/>
				</div>

				<div className="md:col-span-4">
					<ChartBarLabel
						variant="tasks_completed"
						report={userReports?.tasks_completed_last_6_months}
						config={{
							title: "Tasks Completed (Last 6 Months)",
							labelKey: "label",
							valueKey: "tasks_completed",
							color: "hsl(200 80% 55%)",
							total: userReports?.tasks_completed_last_6_months?.data_count,
						}}
					/>
				</div>
				{/* 
				<div className="md:col-span-6">
					<ChartBarHorizontal report={userReports?.tasks_completed_per_user} title="Tasks Completed per User" />
				</div> */}

				<div className="md:col-span-6">
					<PlaceholderChart title="Completion Velocity Trend" />
				</div>

				{/* ========================================== */}
				{/* 2️⃣ EFFICIENCY METRICS */}
				{/* ========================================== */}
				<SectionTitle icon="🌟">Efficiency Metrics</SectionTitle>

				<div className="flex flex-col md:flex-row gap-4 md:col-span-12">
					<SectionCard description="Time Efficiency" showBadge={false} value={`${userReports?.section_cards?.time_efficiency}%`} variant="" />
					<SectionCard
						description="Avg Days Taken per Task"
						showBadge={false}
						value={`${userReports?.section_cards?.average_days_per_task}%`}
						variant=""
					/>
					<SectionCard
						description="📊 Tasks Ahead of Schedule"
						showBadge={false}
						value={`${userReports?.section_cards?.tasks_ahead_of_schedule}%`}
						variant=""
					/>
				</div>

				<div className="md:col-span-6">
					<ChartBarMultiple report={userReports?.estimate_vs_actual} type={"user"} />
				</div>

				<div className="md:col-span-6">
					<RadarChartGridFilled report={userReports?.rating_per_category} />
				</div>

				<div className="md:col-span-6">
					<PlaceholderChart title="Overrun / Underrun Ratio" />
				</div>

				<div className="md:col-span-6">
					<PlaceholderChart title="Avg Time per Category/Project" />
				</div>

				{/* ========================================== */}
				{/* 4️⃣ QUALITY & CONSISTENCY METRICS */}
				{/* ========================================== */}
				<SectionTitle icon="💯">Quality & Consistency Metrics</SectionTitle>

				<div className="flex flex-col md:flex-row gap-4 md:col-span-12">
					<SectionCard description="Performance Rating (5)" showBadge={false} value={`${userReports?.section_cards?.avg_performance}`} variant="" />
					<SectionCard description="📊 Performance Variance" showBadge={false} value="Coming Soon" variant="" />
				</div>

				<div className="md:col-span-6">
					<ChartLineLabel report={userReports?.performance_rating_trend} title="Performance Trends" metricLabel="Performance Rating" />
				</div>

				<div className="md:col-span-6">
					<ChartLineLabel report={userReports?.completion_velocity} title="Completion Velocity" metricLabel="Completion Rate (%)" />
				</div>

				{/* ========================================== */}
				{/* 5️⃣ WORKLOAD & BALANCE METRICS */}
				{/* ========================================== */}
				<SectionTitle icon="💪">Workload & Balance Metrics</SectionTitle>

				<div className="flex flex-col md:flex-row gap-4 md:col-span-12">
					<SectionCard
						description="Avg Estimated Days"
						showBadge={false}
						value={`${userReports?.section_cards?.average_estimated_days}`}
						variant=""
					/>
					<SectionCard description="Avg Actual Days" showBadge={false} value={`${userReports?.section_cards?.average_actual_days}`} variant="" />
					<SectionCard description="📊 Workload Balance Index" showBadge={false} value="Coming Soon" variant="" />
					<SectionCard description="📊 Utilization Rate" showBadge={false} value="Coming Soon" variant="" />
				</div>

				<div className="md:col-span-6">
					<AreaChartGradient report={userReports?.task_activity_timeline} />
				</div>

				{/* ========================================== */}
				{/* TASKS TABLE */}
				{/* ========================================== */}
				<SectionTitle icon="📋">Tasks</SectionTitle>

				<div className="md:col-span-12 min-h-[500px] max-h-[700px] overflow-auto scrollbar-custom bg-card text-card-foreground border border-border rounded-2xl container p-4 md:p-10 shadow-md">
					<div className="flex items-center justify-between">
						<div>
							<h1 className=" font-extrabold text-3xl">Tasks</h1>
							<p>
								View list of all tasks
								{userReports?.user_tasks?.filters?.from && userReports?.user_tasks?.filters?.to
									? ` for ${new Date(userReports?.user_tasks?.filters.from).toLocaleDateString("en-CA", {
											month: "short",
											day: "numeric",
											year: "numeric",
									  })} - ${new Date(userReports?.user_tasks?.filters.to).toLocaleDateString("en-CA", {
											month: "short",
											day: "numeric",
											year: "numeric",
									  })}`
									: ""}
							</p>
						</div>
						{/* Tabs */}
						<div className="gap-1 ml-4 inline-flex rounded-md bg-muted/5 p-1">
							<Button title="Grid view" variant={view === "grid" ? "" : "ghost"} onClick={() => setView("grid")}>
								<Rows3 size={16} />
							</Button>
							<Button title="Table view" variant={view === "list" ? "" : "ghost"} onClick={() => setView("list")}>
								<Table size={16} />
							</Button>
						</div>
					</div>

					<div className="w-full justify-between flex items-center my-4 gap-2">
						<div className="flex flex-col gap-2 justify-between w-[350px] ml-2 md:ml-0">
							<Select
								onValueChange={(value) => {
									const selected = projects.find((project) => String(project.id) === value);
									setSelectedProject(selected);
								}}
								value={selectedProject ? String(selectedProject.id) : ""}
							>
								<SelectTrigger>
									<SelectValue placeholder="All Projects" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={null}>All Projects</SelectItem>
									{Array.isArray(projects) && projects.length > 0 ? (
										projects.map((project) => (
											// <SelectItem key={project.id} value={project.id}>
											<SelectItem key={project.id} value={String(project.id)}>
												{project.title}
											</SelectItem>
										))
									) : (
										<SelectItem disabled>No projects available</SelectItem>
									)}
								</SelectContent>
							</Select>

							{/* Project Progress Bar */}
							<div className="w-full text-xs text-muted-foreground flex flex-col items-end">
								<span>{taskProgressText}</span>
								<Progress value={taskProgressValue} progressColor="bg-primary/50" className="h-2 w-full mt-1" />
							</div>
						</div>
						<Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
							<SheetTrigger asChild>
								<Button variant="">
									<Plus /> Add Task
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="overflow-y-auto w-full sm:w-[640px] p-2 md:p-6">
								<SheetHeader>
									<SheetTitle>
										<Tabs
											loading={tasksLoading}
											updateData={updateData}
											activeTab={activeTab}
											setActiveTab={setActiveTab}
											parentId={parentId}
										/>
									</SheetTitle>
									<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
								</SheetHeader>
								{activeTab == "history" ? (
									<History selectedTaskHistory={selectedTaskHistory} />
								) : activeTab == "relations" ? (
									<Relations setUpdateData={setUpdateData} setParentId={setParentId} setProjectId={setProjectId} />
								) : activeTab == "discussions" ? (
									<TaskDiscussions taskId={updateData?.id} />
								) : (
									<TaskForm
										parentId={parentId}
										projectId={projectId}
										isOpen={isOpen}
										setIsOpen={setIsOpen}
										updateData={updateData}
										setUpdateData={setUpdateData}
									/>
								)}
							</SheetContent>
						</Sheet>
					</div>
					{/* TODO: Feat - Medium - Update Task Views */}
					{(() => {
						const {
							columnsTask: taskColumns,
							dialog,
							bulkDialog,
						} = columnsTask({
							dialogOpen,
							setDialogOpen,
							setIsOpen,
							setUpdateData,
						});
						const context = selectedProject ? "project" : "all_projects";
						const contextId = selectedProject?.id || null;
						return (
							<>
								{view === "list" ? (
									<>
										<DataTableTasks columns={taskColumns} data={tableData} showLess={true} />
										{dialog}
										{bulkDialog}
									</>
								) : (
									<>
										<GridList
											// tasks={tableData}
											tasks={tableData}
											setIsOpen={setIsOpen}
											setUpdateData={setUpdateData}
											setParentId={setParentId}
											setProjectId={setProjectId}
											deleteDialogOpen={deleteDialogOpen}
											setDeleteDialogOpen={setDeleteDialogOpen}
											context={context}
											contextId={contextId}
										/>
										{dialog}
										{bulkDialog}
									</>
								)}
							</>
						);
					})()}
				</div>
			</div>
		</div>
	);
}
