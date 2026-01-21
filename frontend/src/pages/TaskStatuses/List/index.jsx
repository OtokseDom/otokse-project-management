import axiosClient from "@/axios.client";
import React, { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { API } from "@/constants/api";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { columnsTaskStatus } from "./columns";

export default function TaskStatuses() {
	const { taskStatuses, setTaskStatuses, setTaskStatusesLoading } = useTaskStatusesStore();
	const [isOpen, setIsOpen] = useState(false);
	const [updateData, setUpdateData] = useState({});
	const [dialogOpen, setDialogOpen] = useState(false);

	useEffect(() => {
		if (!isOpen) setUpdateData({});
	}, [isOpen]);
	useEffect(() => {
		document.title = "Task Management | Task Statuses";
		if (!taskStatuses || taskStatuses.length === 0) fetchData();
	}, []);
	const fetchData = async () => {
		setTaskStatusesLoading(true);
		try {
			// Make both API calls concurrently using Promise.all
			const taskStatusResponse = await axiosClient.get(API().task_status());
			setTaskStatuses(taskStatusResponse.data.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			// Always stop loading when done
			setTaskStatusesLoading(false);
		}
	};

	return (
		<div className="w-screen md:w-full bg-card text-card-foreground border border-border rounded-2xl container p-4 md:p-10 shadow-md">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60  z-40 transition-opacity duration-300 pointer-events-none ${
					dialogOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			<div>
				<h1 className=" font-extrabold text-3xl">Task Statuses</h1>
				<p>View list of all task statuses</p>
			</div>
			{/* Updated table to fix dialog per column issue */}
			{(() => {
				const { columnsTaskStatus: taskStatusColumns, dialog } = columnsTaskStatus({ setIsOpen, setUpdateData, dialogOpen, setDialogOpen });
				return (
					<>
						<DataTable columns={taskStatusColumns} updateData={updateData} setUpdateData={setUpdateData} isOpen={isOpen} setIsOpen={setIsOpen} />
						{dialog}
					</>
				);
			})()}
		</div>
	);
}
