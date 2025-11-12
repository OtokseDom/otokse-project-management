"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Edit, Plus, MoreHorizontal, Copy, Trash2 } from "lucide-react";
import { format } from "date-fns";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useTaskHelpers, statusColors, priorityColors } from "@/utils/taskHelpers";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useToast } from "@/contexts/ToastContextProvider";
import { Button } from "@/components/ui/button";

export default function TaskGridItem({ task, setIsOpen = () => {}, setUpdateData = () => {}, setParentId = () => {}, setProjectId = () => {} }) {
	const [open, setOpen] = useState(false);
	const { fetchTasks, fetchReports } = useTaskHelpers();
	const { loading, setLoading } = useLoadContext();
	const showToast = useToast();

	const hasChildren = Array.isArray(task.children) && task.children.length > 0;

	const formatDateSafe = (d) => {
		if (!d) return null;
		try {
			return format(new Date(d), "MMM dd, yyyy");
		} catch {
			return d;
		}
	};

	const dueString = task.end_date ? formatDateSafe(task.end_date) : "No due";
	const startString = task.start_date ? formatDateSafe(task.start_date) : null;
	const estimate = task.estimate_hours ?? task.time_estimate ?? task.time_estimate_hours ?? null;
	const priority = task.priority ?? task.priority_label ?? null;
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
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<h3 className="text-lg font-bold">{task.title || "Untitled task"}</h3>
					<p className="text-sm text-muted-foreground mt-1">{task.description || ""}</p>
				</div>

				<div className="flex flex-col items-end gap-2">
					{/* status pill uses statusColors mapping */}
					{task.status?.name ? (
						<span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusClass}`}>{task.status.name}</span>
					) : (
						<span className="text-xs px-2 py-0.5 rounded-md bg-muted/20 text-muted-foreground">No status</span>
					)}
					{priority && <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${priorityClass}`}>{priority}</span>}
				</div>
			</div>

			{/* Details row */}
			<div className="mt-3 grid grid-cols-2 gap-4 items-start">
				{/* left column: metadata */}
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-2 text-sm">
						{/* assignees */}
						{assigneeNames.length > 0 ? (
							<>
								{assigneeNames.slice(0, 3).map((n, i) => (
									<span key={i} className="px-2 py-1 rounded-full bg-background/50 border border-foreground/50 text-foreground text-xs">
										{n}
									</span>
								))}
								{assigneeNames.length > 3 && <span className="px-2 py-1 rounded bg-muted/6 text-xs">+{assigneeNames.length - 3}</span>}
							</>
						) : (
							<span className="px-2 py-1 rounded bg-muted/6 text-xs">Unassigned</span>
						)}

						{/* project */}
						{projectName && <span className="px-2 py-1 rounded bg-muted/6 text-xs">{projectName}</span>}

						{/* estimate */}
						{estimate !== null && <span className="px-2 py-1 rounded bg-muted/6 text-xs">{estimate}h</span>}
					</div>

					{/* dates */}
					<div className="text-xs text-muted-foreground">
						{startString && (
							<div>
								Start: <span className="text-card-foreground">{startString}</span>
							</div>
						)}
						<div>
							Due: <span className="text-card-foreground">{dueString}</span>
						</div>
					</div>

					{/* tags */}
					{Array.isArray(task.tags) && task.tags.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-2">
							{task.tags.slice(0, 4).map((t) => (
								<span key={t.id ?? t} className="text-xs px-2 py-0.5 rounded bg-muted/6">
									{t.name ?? t}
								</span>
							))}
						</div>
					)}
				</div>

				{/* right column: actions + subtasks toggle */}
				<div className="flex flex-col items-end gap-2">
					{/* subtasks toggle */}
					{hasChildren ? (
						<Button
							onClick={() => setOpen((s) => !s)}
							className="inline-flex items-center gap-2 text-sm text-muted-foreground mt-2"
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
							<Edit size={14} />
							<span className="hidden sm:inline">Edit</span>
						</Button>

						<Button variant="ghost" size="sm" onClick={() => handleClone(task)} title="Clone">
							<Copy size={14} />
							<span className="hidden sm:inline">Clone</span>
						</Button>

						<Button variant="ghost" size="sm" onClick={() => handleAddSubtask(task)} title="Add subtask">
							<Plus size={14} />
							<span className="hidden sm:inline">Subtask</span>
						</Button>

						<Button variant="ghost" size="sm" onClick={() => handleDelete(task)} title="Delete">
							<Trash2 size={14} className="text-destructive" />
							<span className="hidden sm:inline">Delete</span>
						</Button>
					</div>
				</div>
			</div>

			{/* subtasks list */}
			{hasChildren && open && (
				<div className="mt-3 space-y-2">
					{task.children.map((sub) => (
						<div key={sub.id} className="flex items-center justify-between gap-2 bg-muted/6 px-3 py-2 rounded">
							<div className="min-w-0">
								<div className="text-sm font-medium truncate">{sub.title}</div>
								<div className="text-xs text-muted-foreground truncate">
									{sub.assignees &&
										Array.isArray(sub.assignees) &&
										sub.assignees
											.map((a) => a.name)
											.slice(0, 3)
											.join(", ")}
									{sub.project?.title ? ` • ${sub.project.title}` : ""}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button onClick={() => openEdit(sub)} className="px-2 py-1 text-xs rounded bg-accent/10 hover:bg-accent/20">
									Edit
								</button>
								<button onClick={() => handleClone(sub)} className="px-2 py-1 text-xs rounded bg-muted/6 hover:bg-muted/8">
									Clone
								</button>
								<button onClick={() => handleDelete(sub)} className="px-2 py-1 text-xs rounded bg-destructive/10 hover:bg-destructive/20">
									Delete
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
