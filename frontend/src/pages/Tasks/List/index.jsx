import React, { useEffect, useState } from "react";
import { columnsTask } from "./datatable/columns";
import { DataTableTasks } from "./datatable/data-table";
import { flattenTasks, useTaskHelpers } from "@/utils/taskHelpers";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useUsersStore } from "@/store/users/usersStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import GridList from "./grid/gridList";
import { Button } from "@/components/ui/button";
import { List, Plus, Rows3 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskForm from "../form";
import History from "@/components/task/History";
import Relations from "@/components/task/Relations";
import Tabs from "@/components/task/Tabs";
import { TaskDiscussions } from "@/components/task/Discussion";
import { useLoadContext } from "@/contexts/LoadContextProvider";

export default function Tasks() {
	const { loading, setLoading } = useLoadContext();
	const { tasks, tasksLoaded, setRelations, selectedTaskHistory, activeTab, setActiveTab } = useTasksStore();
	const [filteredTasks, setFilteredTasks] = useState([]);
	const { users } = useUsersStore();
	const { projects, projectsLoaded, selectedProject, setSelectedProject } = useProjectsStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { categories } = useCategoriesStore();
	// Fetch Hooks
	const { fetchTasks, fetchProjects, fetchUsers, fetchCategories, fetchTaskStatuses } = useTaskHelpers();
	const [isOpen, setIsOpen] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);

	const [updateData, setUpdateData] = useState({});
	const [parentId, setParentId] = useState(null); //for adding subtasks from relations tab
	const [projectId, setProjectId] = useState(null); //for adding subtasks from relations tab

	// Flatten tasks for datatable usage (also groups children below parent)
	const [tableData, setTableData] = useState([]);

	// New view state: 'list' or 'grid'
	const [view, setView] = useState(() => "list");

	useEffect(() => {
		if (!isOpen) {
			setUpdateData({});
			setRelations({});
			setActiveTab("update");
			setParentId(null);
			setProjectId(null);
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
		if (selectedProject) {
			const filtered = tasks.filter((task) => task.project_id === selectedProject.id);
			if (filtered !== null) setTableData(flattenTasks(filtered));
			setFilteredTasks(filtered);
		} else {
			if (tasks !== null) setTableData(flattenTasks(tasks));
			setFilteredTasks(tasks);
		}
	}, [tasks, selectedProject]);

	return (
		<div className="w-screen md:w-full bg-card text-card-foreground border border-border rounded-2xl container p-4 md:p-10 shadow-md">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen || dialogOpen
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
				<div>
					<h1 className=" font-extrabold text-3xl">Tasks</h1>
					<p>View list of all tasks</p>
				</div>
				{/* Tabs */}
				<div className="ml-4 inline-flex rounded-md bg-muted/5 p-1">
					<Button variant={view === "list" ? "" : "ghost"} onClick={() => setView("list")}>
						<List size={16} />
					</Button>
					<Button variant={view === "grid" ? "" : "ghost"} onClick={() => setView("grid")}>
						<Rows3 size={16} />
					</Button>
				</div>
			</div>
			<div className="w-full justify-between flex items-center my-4 gap-2">
				<div className="flex flex-row justify-between w-[250px] ml-2 md:ml-0">
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
				</div>
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
								<Tabs loading={loading} updateData={updateData} activeTab={activeTab} setActiveTab={setActiveTab} parentId={parentId} />
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

				return (
					<>
						{view === "list" ? (
							<>
								<DataTableTasks columns={taskColumns} data={tableData} />
								{dialog}
								{bulkDialog}
							</>
						) : (
							<>
								<GridList
									tasks={filteredTasks}
									setIsOpen={setIsOpen}
									setUpdateData={setUpdateData}
									setParentId={setParentId}
									setProjectId={setProjectId}
								/>
								{dialog}
								{bulkDialog}
							</>
						)}
					</>
				);
			})()}
		</div>
	);
}
