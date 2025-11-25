import React, { useEffect } from "react";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useTaskHelpers } from "@/utils/taskHelpers";
import KanbanBoard from "./kanban";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsersStore } from "@/store/users/usersStore";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
export default function Kanban() {
	const { tasks, tasksLoaded, tasksLoading } = useTasksStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { users } = useUsersStore();
	const { categories } = useCategoriesStore();
	const { projects, projectsLoaded, selectedProject, setSelectedProject } = useProjectsStore();
	const { fetchTasks, fetchTaskStatuses, fetchProjects, fetchCategories, fetchUsers } = useTaskHelpers();

	useEffect(() => {
		document.title = "Task Management | Board";
		if ((!tasks || tasks.length === 0) && !tasksLoaded) fetchTasks();
		if ((!projects || projects.length === 0) && !projectsLoaded) fetchProjects();
		else if (!selectedProject) setSelectedProject(projects[0]);
		if (!taskStatuses || taskStatuses.length === 0) fetchTaskStatuses();
		if (!users || users.length === 0) fetchUsers();
		if (!categories || categories.length === 0) fetchCategories();
	}, []);

	return (
		<div className="flex flex-col gap-2 mt-5 md:mt-0 w-screen md:w-full md:max-w-[calc(100vw-22rem)] h-[calc(100vh-4rem)]">
			{/* Top section: project select */}
			<div className="flex flex-row justify-between w-[250px] ml-2 md:ml-0">
				<Select
					onValueChange={(value) => {
						const selected = projects.find((project) => String(project.id) === value);
						setSelectedProject(selected);
					}}
					value={selectedProject ? String(selectedProject.id) : ""}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a project" />
					</SelectTrigger>
					<SelectContent>
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
			{/* Kanban section: scrollable */}
			<div className="w-full overflow-x-auto h-full">
				<div className="min-w-full">
					{tasksLoading ? (
						// <div className="flex flex-row space-x-3 w-max h-full">
						<div className="flex flex-col md:flex-row space-y-2 md:space-x-2 w-full h-[calc(100vh-11rem)]">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} index={i * 0.9} className="h-full w-full mt-2" />
							))}
						</div>
					) : (
						<KanbanBoard />
					)}
				</div>
			</div>
		</div>
	);
}
