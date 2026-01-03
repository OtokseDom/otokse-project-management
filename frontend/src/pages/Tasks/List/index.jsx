import React, { useEffect, useState } from "react";
import { columnsTask } from "./datatable/columns";
import { DataTableTasks } from "./datatable/data-table";
import { flattenTasks, getProjectProgress, useTaskHelpers } from "@/utils/taskHelpers";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useUsersStore } from "@/store/users/usersStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import GridList from "./grid/gridList";
import { Button } from "@/components/ui/button";
import { CalendarDays, Kanban, Plus, Rows3, Table } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskForm from "../form";
import History from "@/components/task/History";
import Relations from "@/components/task/Relations";
import Tabs from "@/components/task/Tabs";
import { TaskDiscussions } from "@/components/task/Discussion";
import { Progress } from "@/components/ui/progress";
import { useEpicsStore } from "@/store/epics/epicsStore";
import ScheduleCalendar from "@/pages/Schedules/calendar";
// TODO: Add calendar and kanban view as task view options
export default function Tasks() {
	// const { loading, setLoading } = useLoadContext();
	const inTasks = location.pathname.startsWith("/tasks") ? true : false;
	const { tasks, tasksLoaded, setRelations, selectedTaskHistory, activeTab, setActiveTab, tasksLoading } = useTasksStore();
	const [filteredTasks, setFilteredTasks] = useState([]);
	const { users } = useUsersStore();
	const { selectedEpic, setSelectedEpic } = useEpicsStore();
	const { projects, projectsLoaded, selectedProject, setSelectedProject } = useProjectsStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { categories } = useCategoriesStore();
	// Fetch Hooks
	const { fetchTasks, fetchProjects, fetchUsers, fetchCategories, fetchTaskStatuses } = useTaskHelpers();
	const [isOpen, setIsOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const [updateData, setUpdateData] = useState({});
	const [parentId, setParentId] = useState(null); //for adding subtasks from relations tab

	// Set whether Epic projects or all projects are in use
	const [activeProjects, setActiveProjects] = useState([]);

	// Flatten tasks for datatable usage (also groups children below parent)
	const [tableData, setTableData] = useState([]);

	// New view state: 'list' or 'grid'
	const [view, setView] = useState(() => "grid");

	useEffect(() => {
		if (!isOpen) {
			setUpdateData({});
			setRelations({});
			setActiveTab("update");
			setParentId(null);
		}
	}, [isOpen]);

	useEffect(() => {
		document.title = "Task Management | Tasks";
		if (!taskStatuses || taskStatuses.length === 0) fetchTaskStatuses();
		if (!users || users.length === 0) fetchUsers();
		if (!categories || categories.length === 0) fetchCategories();
		if ((!tasks || tasks.length === 0) && !tasksLoaded) fetchTasks();
		if ((!projects || projects.length === 0) && !projectsLoaded) fetchProjects();
	}, []);

	useEffect(() => {
		const allProjects = Array.isArray(projects) ? projects : [];

		if (inTasks) {
			// On tasks page show all projects
			setActiveProjects(allProjects);
			// ensure selected project is a single project object (first one if none or no longer valid)
			if (!selectedProject || !allProjects.find((p) => p?.id === selectedProject?.id)) {
				setSelectedProject(allProjects.length ? allProjects[0] : null);
			}
		} else {
			// On epics page show only projects belonging to selectedEpic
			const tempEpicProjects =
				selectedEpic !== null && selectedEpic !== undefined ? allProjects.filter((project) => String(project?.epic_id) === String(selectedEpic)) : [];
			setActiveProjects(tempEpicProjects);
			if (!selectedProject || !tempEpicProjects.find((p) => p?.id === selectedProject?.id)) {
				setSelectedProject(tempEpicProjects.length ? tempEpicProjects[0] : null);
			}
		}
	}, [projects, selectedEpic, inTasks]);

	useEffect(() => {
		if (selectedProject) {
			const filtered = tasks.filter((task) => task.project_id === selectedProject.id);
			if (filtered !== null) setTableData(flattenTasks(filtered));
			setFilteredTasks(filtered);
		} else {
			setTableData([]);
			setFilteredTasks([]);
		}
	}, [tasks, selectedProject]);

	const { text: taskProgressText, value: taskProgressValue } = getProjectProgress();

	return (
		<div className="w-screen md:w-full px-2 md:px-0">
			<div className="w-full bg-card text-card-foreground border border-border rounded-2xl p-4 md:p-6 shadow-md">
				<div
					className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
						isOpen || dialogOpen || deleteDialogOpen
							? // || deleteDialogOpen
							  "opacity-100"
							: "opacity-0"
					}`}
					aria-hidden="true"
				/>
				<div
					className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
						dialogOpen ? "opacity-100" : "opacity-0"
					}`}
					aria-hidden="true"
				/>
				<div className="flex items-center justify-between">
					<div className="flex flex-col w-full gap-2">
						{/* Tabs */}
						<div className="flex w-full overflow-auto p-2">
							<Button title="Grid view" variant={view === "grid" ? "" : "ghost"} onClick={() => setView("grid")}>
								<Rows3 size={16} /> List
							</Button>
							<Button title="Table view" variant={view === "list" ? "" : "ghost"} onClick={() => setView("list")}>
								<Table size={16} /> Table
							</Button>
							<Button title="Calendar view" variant={view === "calendar" ? "" : "ghost"} onClick={() => setView("calendar")}>
								<CalendarDays size={16} /> Calendar
							</Button>
							<Button title="Kanban view" variant={view === "kanban" ? "" : "ghost"} onClick={() => setView("kanban")}>
								<Kanban size={16} /> Kanban Board
							</Button>
						</div>
						<div className="flex w-full justify-between items-center">
							<h1 className=" font-extrabold text-xl">Tasks</h1>
							<Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
								<SheetTrigger asChild>
									<Button variant="">
										<Plus />
										Add Task
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
										<Relations setUpdateData={setUpdateData} setParentId={setParentId} />
									) : activeTab == "discussions" ? (
										<TaskDiscussions taskId={updateData?.id} />
									) : (
										<TaskForm
											parentId={parentId}
											isOpen={isOpen}
											setIsOpen={setIsOpen}
											updateData={updateData}
											setUpdateData={setUpdateData}
										/>
									)}
								</SheetContent>
							</Sheet>
						</div>
					</div>
				</div>
				<div className="w-full justify-between flex items-start my-4 gap-2">
					<div className="flex flex-col md:flex-row gap-2 justify-between w-full">
						<div className="flex flex-col gap-2 w-96 max-w-full">
							<span className="text-muted-foreground font-bold">Project</span>
							<Select
								onValueChange={(value) => {
									setSelectedProject(activeProjects.find((project) => String(project.id) === value));
								}}
								value={selectedProject ? String(selectedProject.id) : ""}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select Project" />
								</SelectTrigger>
								<SelectContent>
									{Array.isArray(activeProjects) && activeProjects.length > 0 ? (
										activeProjects.map((project) => (
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
						</div>
						{/* Project Progress Bar */}
						<div className="w-96 max-w-full text-xs text-muted-foreground flex flex-col items-end">
							<span>{taskProgressText}</span>
							<Progress value={taskProgressValue} progressColor="bg-primary/50" className="h-2 w-full mt-1" />
						</div>
					</div>
				</div>
				{/* Updated table to fix dialog per column issue */}
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
									<DataTableTasks columns={taskColumns} data={tableData} />
									{dialog}
									{bulkDialog}
								</>
							) : view === "grid" ? (
								<>
									<GridList
										tasks={filteredTasks}
										setIsOpen={setIsOpen}
										setUpdateData={setUpdateData}
										setParentId={setParentId}
										deleteDialogOpen={deleteDialogOpen}
										setDeleteDialogOpen={setDeleteDialogOpen}
										context={context}
										contextId={contextId}
									/>
									{dialog}
									{bulkDialog}
								</>
							) : (
								<>
									<ScheduleCalendar />
								</>
							)}
						</>
					);
				})()}
			</div>
		</div>
	);
}
