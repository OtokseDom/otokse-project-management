"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Edit, Plus, MoreHorizontal, Copy, Trash2, User, CalendarDaysIcon, Target, CircleDot, Circle } from "lucide-react";
import { format } from "date-fns";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useTaskHelpers, statusColors, priorityColors } from "@/utils/taskHelpers";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useToast } from "@/contexts/ToastContextProvider";
import { Button } from "@/components/ui/button";
import UpdateDialog from "../updateDialog";

export default function TaskGridItem({ task, setIsOpen = () => {}, setUpdateData = () => {}, setParentId = () => {}, setProjectId = () => {} }) {
	const [open, setOpen] = useState(false);
	const { fetchTasks, fetchReports } = useTaskHelpers();
	const { loading, setLoading } = useLoadContext();
	const showToast = useToast();
	const [bulkAction, setBulkAction] = useState(null);
	const [selectedTasks, setSelectedTasks] = useState(null);

	const hasChildren = Array.isArray(task.children) && task.children.length > 0;

	const formatDateSafe = (d) => {
		if (!d) return null;
		try {
			return format(new Date(d), "MMM dd, yyyy");
		} catch {
			return d;
		}
	};

	const endString = task.end_date ? formatDateSafe(task.end_date) : null;
	const startString = task.start_date ? formatDateSafe(task.start_date) : null;
	const actualString = task.actual_date ? formatDateSafe(task.actual_date) : null;
	const priority = task.priority ?? null;
	const category = task.category?.name ?? null;
	const projectName = task.project?.title ?? task.project?.name ?? null;

	// assignees array handling
	const assignees = Array.isArray(task.assignees) ? task.assignees : [];
	const assigneeNames = assignees.map((a) => a.name);

	const statusKey = task.status?.color ? String(task.status.color).toLowerCase() : null;
	const statusClass = statusColors?.[statusKey] ?? "bg-muted/20 text-muted-foreground";
	const priorityClass = priorityColors?.[priority] ?? "bg-muted/20 text-muted-foreground";

	const openEdit = (t) => {
		// reuse datatable form/dialog
		setUpdateData(t);
		setIsOpen(true);
	};

	const handleClone = (t) => {
		const cloned = {
			...t,
			id: undefined,
			title: `${t.title} (Clone)`,
			calendar_add: true,
		};
		setUpdateData(cloned);
		setIsOpen(true);
	};

	const handleAddSubtask = (parent) => {
		setParentId(parent.id);
		setProjectId(parent.project_id || null);
		setUpdateData({}); // empty payload for new subtask
		setIsOpen(true);
	};

	const handleDelete = async (t) => {
		if (!confirm("Delete task? This cannot be undone.")) return;
		setLoading(true);
		try {
			await axiosClient.delete(API().task(t.id));
			await fetchTasks();
			await fetchReports();
			showToast("Success!", "Task deleted.", 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message || e.message, 3000, "fail");
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-sidebar text-card-foreground border border-border rounded-lg p-4 flex flex-col shadow-sm w-full">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-2">
				<div className="flex flex-row items-end gap-2">
					{/* status pill uses statusColors mapping */}
					{task.status?.name ? <span className={`text-xs px-2 py-1 rounded-md font-medium ${statusClass}`}>{task.status.name}</span> : ""}
					{priority && <span className={`text-xs px-2 py-1 rounded-md font-medium ${priorityClass}`}>{priority}</span>}
					{category && (
						<span className="flex justify-center items-center px-2 py-1 rounded-md bg-background/50 border-2 border-foreground/50 text-foreground text-xs gap-2">
							{category}
						</span>
					)}
				</div>
				<div className="min-w-0 flex flex-col gap-2">
					<h3 className="text-lg font-bold">{task.title || "Untitled task"}</h3>

					{/* project */}
					{projectName && <span className="font-bold text-muted-foreground text-sm">{projectName}</span>}

					<div
						className="text-xs text-muted-foreground prose prose-sm max-w-none
												 			[&_ul]:list-disc [&_ul]:pl-6
															[&_ol]:list-decimal [&_ol]:pl-6
															[&_li]:my-1"
						dangerouslySetInnerHTML={{ __html: task.description }}
					/>
				</div>
			</div>
			<hr className="mt-2" />
			{/* Details row */}
			<div className="flex flex-col mt-3 gap-2 items-start">
				{/* left column: metadata */}
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-2 text-sm">
						{/* assignees */}
						{assigneeNames.length > 0 ? (
							<>
								{assigneeNames.slice(0, 3).map((n, i) => (
									<span
										key={i}
										className="flex justify-center items-center px-2 py-1 rounded-full bg-background/50 border-2 border-foreground/50 text-foreground text-xs gap-2"
									>
										<User size={16} /> {n}
									</span>
								))}
								{assigneeNames.length > 3 && <span className="px-2 py-1 rounded bg-muted/6 text-xs">+{assigneeNames.length - 3}</span>}
							</>
						) : (
							""
						)}
					</div>

					{/* dates */}
					<div className="flex flex-wrap text-xs text-muted-foreground gap-4">
						{startString && (
							<div className="flex gap-1">
								<CalendarDaysIcon size={16} /> Start: <span className="text-card-foreground">{startString}</span>
							</div>
						)}
						{endString && (
							<div className="flex gap-1">
								<CalendarDaysIcon size={16} /> End: <span className="text-card-foreground">{endString}</span>
							</div>
						)}
						{actualString && (
							<div className="flex gap-1">
								<Target size={16} /> Actual: <span className="text-card-foreground">{actualString}</span>
							</div>
						)}
					</div>
				</div>

				{/* right column: actions + subtasks toggle */}
				<div className="flex flex-row justify-between items-center w-full">
					{/* subtasks toggle */}
					{hasChildren ? (
						<Button
							variant="outline"
							onClick={() => setOpen((s) => !s)}
							className="inline-flex items-center gap-2 text-sm mt-2"
							aria-expanded={open}
						>
							{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
							<span className="text-xs">{task.children.length} subtasks</span>
						</Button>
					) : (
						<span className="text-xs text-muted-foreground mt-2">No subtasks</span>
					)}

					<div className="flex items-center gap-2">
						<Button variant="ghost" size="sm" onClick={() => openEdit(task)} title="Edit">
							<Edit size={12} />
							<span className="hidden sm:inline text-xs">Edit</span>
						</Button>

						<Button variant="ghost" size="sm" onClick={() => handleClone(task)} title="Clone">
							<Copy size={12} />
							<span className="hidden sm:inline text-xs">Clone</span>
						</Button>

						<Button variant="ghost" size="sm" onClick={() => handleAddSubtask(task)} title="Add subtask">
							<Plus size={12} />
							<span className="hidden sm:inline text-xs">Subtask</span>
						</Button>

						<Button variant="ghost" size="sm" onClick={() => handleDelete(task)} title="Delete">
							<Trash2 size={12} className="text-destructive" />
							<span className="hidden sm:inline text-xs">Delete</span>
						</Button>
					</div>
				</div>
			</div>

			{/* subtasks list */}
			{hasChildren && open && (
				<div className="w-full rounded mt-3 ">
					<hr />
					{task.children.map((sub) => (
						<div key={sub.id} className="flex items-center justify-between border-b border-accent gap-2 bg-accent/50 px-3 py-2">
							<div className="flex flex-col gap-2 min-w-0">
								<div className={`flex gap-1 items-start text-sm font-medium`}>
									<span
										title={sub.status?.name || "No status"}
										className={`mt-0.5 p-1.5 rounded-full hover:cursor-pointer ${statusColors?.[sub.status?.color?.toLowerCase()]}`}
										onClick={() => {
											setBulkAction("status");
											setSelectedTasks([sub]);
										}}
									></span>
									{sub.title}
								</div>
								<div className="text-xs text-muted-foreground">
									{sub.assignees &&
										Array.isArray(sub.assignees) &&
										sub.assignees
											.map((a) => a.name)
											.slice(0, 3)
											.join(", ")}
								</div>
							</div>
							<div className="flex flex-col md:flex-row items-center gap-2">
								<button
									onClick={() => openEdit(sub)}
									className="flex gap-2 items-center px-2 py-1 text-xs rounded bg-accent/10 hover:bg-accent/20"
								>
									<Edit size={12} />
									<span className="hidden sm:inline">Edit</span>
								</button>
								<button
									onClick={() => handleClone(sub)}
									className="flex gap-2 items-center px-2 py-1 text-xs rounded bg-muted/6 hover:bg-muted/8"
								>
									<Copy size={12} />
									<span className="hidden sm:inline">Clone</span>
								</button>
								<button
									onClick={() => handleDelete(sub)}
									className="flex gap-2 items-center px-2 py-1 text-xs rounded bg-destructive/10 hover:bg-destructive/20"
								>
									<Trash2 size={12} className="text-destructive" />
									<span className="hidden sm:inline">Delete</span>
								</button>
							</div>
						</div>
					))}
				</div>
			)}
			<UpdateDialog open={!!bulkAction} onClose={() => setBulkAction(null)} action={bulkAction} selectedTasks={selectedTasks} />
		</div>
	);
}
