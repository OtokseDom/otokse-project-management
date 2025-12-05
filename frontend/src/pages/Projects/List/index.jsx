import axiosClient from "@/axios.client";
import React, { useEffect, useState } from "react";
import { columnsProject } from "./columns";
import { useToast } from "@/contexts/ToastContextProvider";
import { DataTableProjects } from "./data-table";
import { API } from "@/constants/api";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";

export default function Projects() {
	const { projects, projectsLoaded, removeProject, removeSelectedProject, setProjectsLoading } = useProjectsStore([]);
	const { taskStatuses } = useTaskStatusesStore();
	const { removeKanbanColumnByProject } = useKanbanColumnsStore();
	const { removeProjectFilter } = useDashboardStore();
	const { fetchProjects, fetchTaskStatuses } = useTaskHelpers();

	const showToast = useToast();
	const [isOpen, setIsOpen] = useState(false);
	const [updateData, setUpdateData] = useState({});
	const [dialogOpen, setDialogOpen] = useState(false);
	useEffect(() => {
		if (!isOpen) setUpdateData({});
	}, [isOpen]);
	useEffect(() => {
		document.title = "Task Management | Projects";
		if (!taskStatuses || taskStatuses.length === 0) fetchTaskStatuses();
		if ((!projects || projects.length === 0) && !projectsLoaded) fetchProjects();
	}, []);
	const handleDelete = async (id) => {
		setProjectsLoading(true);
		try {
			await axiosClient.delete(API().project(id));
			removeProject(id);
			removeKanbanColumnByProject(id);
			removeProjectFilter(id);
			removeSelectedProject();
			showToast("Success!", "Project deleted.", 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setDialogOpen(false);
			setProjectsLoading(false);
		}
	};
	return (
		<div className="w-screen md:w-full bg-card text-card-foreground border border-border rounded-2xl container p-4 md:p-10 shadow-md">
			<div>
				<h1 className=" font-extrabold text-3xl">Projects</h1>
				<p>View list of all projects</p>
			</div>
			{/* Updated table to fix dialog per column issue */}
			{(() => {
				const { columnsProject: projectColumns, dialog } = columnsProject({ handleDelete, setIsOpen, setUpdateData, dialogOpen, setDialogOpen });
				return (
					<>
						<DataTableProjects
							columns={projectColumns}
							updateData={updateData}
							setUpdateData={setUpdateData}
							isOpen={isOpen}
							setIsOpen={setIsOpen}
						/>
						{dialog}
					</>
				);
			})()}
		</div>
	);
}
