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
import { List, Rows3 } from "lucide-react";
export default function Tasks() {
	const { tasks, tasksLoaded, setRelations, setActiveTab } = useTasksStore();
	const { users } = useUsersStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { projects, projectsLoaded } = useProjectsStore();
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
		if (tasks !== null) setTableData(flattenTasks(tasks));
	}, [tasks]);

	return (
		<div className="w-screen md:w-full bg-card text-card-foreground border border-border rounded-2xl container p-4 md:p-10 shadow-md">
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
								<DataTableTasks
									columns={taskColumns}
									data={tableData}
									updateData={updateData}
									setUpdateData={setUpdateData}
									isOpen={isOpen}
									setIsOpen={setIsOpen}
									parentId={parentId}
									setParentId={setParentId}
									projectId={projectId}
									setProjectId={setProjectId}
								/>
								{dialog}
								{bulkDialog}
							</>
						) : (
							<>
								<GridList setIsOpen={setIsOpen} setUpdateData={setUpdateData} setParentId={setParentId} setProjectId={setProjectId} />
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
