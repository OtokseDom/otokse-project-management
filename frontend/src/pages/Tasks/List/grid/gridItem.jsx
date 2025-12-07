"use client";

import React, { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ChevronDown,
	ChevronUp,
	Edit,
	Plus,
	MoreHorizontal,
	Copy,
	Trash2,
	User,
	CalendarDaysIcon,
	Target,
	CircleDot,
	Circle,
	GoalIcon,
	GripVertical,
	Paperclip,
	MessageSquareMore,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import UpdateDialog from "../updateDialog";
import { useTasksStore } from "@/store/tasks/tasksStore";
import DeleteDialog from "../deleteDialog";
import { Progress } from "@/components/ui/progress";
import { getSubtaskProgress, priorityColors, statusColors } from "@/utils/taskHelpers";
import { useTaskDiscussionsStore } from "@/store/taskDiscussions/taskDiscussionsStore";

export default function TaskGridItem({
	task,
	setIsOpen = () => {},
	setUpdateData = () => {},
	setParentId = () => {},
	setProjectId = () => {},
	deleteDialogOpen = false,
	setDeleteDialogOpen,
}) {
	const { tasks, taskHistory, setSelectedTaskHistory, setRelations } = useTasksStore();
	const { taskDiscussions } = useTaskDiscussionsStore();
	const [open, setOpen] = useState(false);
	const [bulkAction, setBulkAction] = useState(null);
	const [selectedTasks, setSelectedTasks] = useState(null);

	// DnD Kit integration
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: `grid-item-${task.id}`,
		data: {
			type: "grid-item",
			task: task,
		},
	});

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

	const assignees = Array.isArray(task.assignees) ? task.assignees : [];
	const assigneeNames = assignees.map((a) => a.name);

	const statusKey = task.status?.color ? String(task.status.color).toLowerCase() : null;
	const statusClass = statusColors?.[statusKey] ?? "bg-muted/20 text-muted-foreground";
	const priorityClass = priorityColors?.[priority] ?? "bg-muted/20 text-muted-foreground";

	const openEdit = (task) => {
		setUpdateData(task);
		setIsOpen(true);
		const filteredHistory = taskHistory.filter((th) => th.task_id === task.id);
		setSelectedTaskHistory(filteredHistory);
		if (!task.parent_id) {
			setRelations(task);
		} else {
			const parentTask = tasks.find((t) => t.id == task.parent_id);
			setRelations(parentTask);
		}
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

	// const handleDelete = async (t) => {
	// 	if (!confirm("Delete task? This cannot be undone.")) return;
	// 	setLoading(true);
	// 	try {
	// 		await axiosClient.delete(API().task(t.id));
	// 		await fetchTasks();
	// 		await fetchReports();
	// 		showToast("Success!", "Task deleted.", 3000);
	// 	} catch (e) {
	// 		showToast("Failed!", e.response?.data?.message || e.message, 3000, "fail");
	// 		console.error(e);
	// 	} finally {
	// 		setLoading(false);
	// 	}
	// };
	// When bulkAction is "delete", just open the dialog
	useEffect(() => {
		if (bulkAction === "delete") {
			setDeleteDialogOpen(true);
		}
	}, [bulkAction]);

	const handleDeleteDialogClose = (open) => {
		setDeleteDialogOpen(open);
		if (!open) setBulkAction(null);
	};
	// Helper to clear selection and reset dialogs
	const clearSelection = () => {
		setSelectedTasks(null);
		setBulkAction(null);
		setDeleteDialogOpen(false);
	};

	// compute subtask progress for this task
	const { text: subtaskProgressText, value: subtaskProgressValue } = getSubtaskProgress(task);

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Translate.toString(transform),
				transition,
				opacity: isDragging ? 0.5 : 1,
			}}
			className="bg-sidebar text-card-foreground border border-border rounded-lg p-4 flex flex-col shadow-sm w-full"
		>
			{/* Header */}
			<div className="w-full py-1 hover:cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
				<GripVertical size={16} />
			</div>
			<div className="flex flex-col md:flex-row items-start justify-between gap-2">
				<div className="min-w-0 flex flex-col order-2 md:order-1 gap-2">
					<div className="flex gap-2">
						<GoalIcon size={32} className="inline-block mt-2 text-primary/50" />
						<div className="flex flex-col gap-0">
							<h3 className="text-lg font-bold">{task.title || "Untitled task"}</h3>
							{/* project */}
							{projectName && <span className="font-bold text-muted-foreground text-sm">{projectName}</span>}
						</div>
					</div>

					<div
						className="text-xs text-muted-foreground prose prose-sm max-w-none
												 			[&_ul]:list-disc [&_ul]:pl-6
															[&_ol]:list-decimal [&_ol]:pl-6
															[&_li]:my-1"
						dangerouslySetInnerHTML={{ __html: task.description }}
					/>
				</div>
				<div className="flex flex-col order-1 md:order-2 justify-end gap-1">
					<div className="flex flex-row justify-end gap-2">
						{/* status pill uses statusColors mapping */}
						{task.status?.name ? (
							<span
								onClick={() => {
									setBulkAction("status");
									setSelectedTasks([task]);
								}}
								className={`text-xs min-w-fit px-2 py-1 rounded-md font-medium hover:cursor-pointer ${statusClass}`}
							>
								{task.status.name}
							</span>
						) : (
							""
						)}
						{priority && (
							<span
								onClick={() => {
									setBulkAction("priority");
									setSelectedTasks([task]);
								}}
								className={`text-xs min-w-fit px-2 py-1 rounded-md font-medium hover:cursor-pointer ${priorityClass}`}
							>
								{priority}
							</span>
						)}
						{category && (
							<span
								onClick={() => {
									setBulkAction("category");
									setSelectedTasks([task]);
								}}
								className="px-2 py-1 min-w-fit rounded-md bg-background/50 border-2 border-foreground/50 text-foreground text-xs gap-2 cursor-pointer"
							>
								{category}
							</span>
						)}
					</div>
					<div className="flex justify-end gap-2">
						{task.attachments && task.attachments.length > 0 && (
							<span title="Attachments">
								<Paperclip className="text-sm text-gray-500" size={16} />
							</span>
						)}
						{taskDiscussions?.filter((d) => d.task_id === task.id).length > 0 && (
							<span title="Task Discussions">
								<MessageSquareMore className="text-sm text-gray-500" size={16} />
							</span>
						)}
					</div>
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
										onClick={() => {
											setBulkAction("assignees");
											setSelectedTasks([task]);
										}}
										className="flex justify-center items-center px-2 py-1 rounded-full bg-background/50 border-2 border-foreground/50 text-foreground text-xs gap-2 hover:cursor-pointer"
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
							<div
								onClick={() => {
									setBulkAction("start_date");
									setSelectedTasks([task]);
								}}
								className="flex gap-1 hover:cursor-pointer"
							>
								<CalendarDaysIcon size={16} /> Start: <span className="text-card-foreground">{startString}</span>
							</div>
						)}
						{endString && (
							<div
								onClick={() => {
									setBulkAction("end_date");
									setSelectedTasks([task]);
								}}
								className="flex gap-1 hover:cursor-pointer"
							>
								<CalendarDaysIcon size={16} /> End: <span className="text-card-foreground">{endString}</span>
							</div>
						)}
						{actualString && (
							<div
								onClick={() => {
									setBulkAction("actual_date");
									setSelectedTasks([task]);
								}}
								className="flex gap-1 hover:cursor-pointer"
							>
								<Target size={16} /> Actual: <span className="text-card-foreground">{actualString}</span>
							</div>
						)}
					</div>
				</div>

				{/* right column: actions + subtasks toggle */}
				<div className="flex flex-row justify-between items-center w-full">
					{/* subtasks toggle */}
					{hasChildren ? (
						<div className="flex flex-col items-end gap-2">
							<Button
								variant="outline"
								onClick={() => setOpen((s) => !s)}
								className="inline-flex items-center gap-2 text-sm mt-2"
								aria-expanded={open}
							>
								{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
								<span className="text-xs">{task.children.length} subtasks</span>
							</Button>
						</div>
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

						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setBulkAction("delete");
								setSelectedTasks([task]);
							}}
							title="Delete"
						>
							<Trash2 size={12} className="text-destructive" />
							<span className="hidden sm:inline text-xs">Delete</span>
						</Button>
					</div>
				</div>

				{/* show same progress as Relations */}
				{hasChildren && (
					<div className="w-full text-xs text-muted-foreground flex flex-col items-end">
						<span>{subtaskProgressText}</span>
						<Progress value={subtaskProgressValue} progressColor="bg-primary/70" className="h-2 w-full mt-1" />
					</div>
				)}
			</div>

			{/* subtasks list */}
			{hasChildren && open && (
				<div className="w-full rounded mt-3 ">
					<hr />
					{task.children.map((sub) => (
						<div key={sub.id} className="flex items-center justify-between border-b border-accent gap-2 bg-accent/50 px-3 py-2">
							<div className="flex flex-col gap-2 min-w-0">
								<div className={`flex gap-1 items-start text-sm font-medium`}>{sub.title}</div>
								<div className="flex flex-wrap text-xs text-muted-foreground gap-4">
									<div
										onClick={() => {
											setBulkAction("assignees");
											setSelectedTasks([sub]);
										}}
										className="flex gap-2 text-xs text-muted-foreground hover:cursor-pointer font-bold"
									>
										<User size={16} />
										{sub.assignees &&
											Array.isArray(sub.assignees) &&
											sub.assignees
												.map((a) => a.name)
												.slice(0, 3)
												.join(", ")}
									</div>
									{formatDateSafe(sub.start_date) && (
										<div
											onClick={() => {
												setBulkAction("start_date");
												setSelectedTasks([sub]);
											}}
											className="hidden md:flex gap-1 hover:cursor-pointer"
										>
											<CalendarDaysIcon size={16} /> Start: <span className="font-bold">{formatDateSafe(sub.start_date)}</span>
										</div>
									)}
									{formatDateSafe(sub.end_date) && (
										<div
											onClick={() => {
												setBulkAction("end_date");
												setSelectedTasks([sub]);
											}}
											className="hidden md:flex gap-1 hover:cursor-pointer"
										>
											<CalendarDaysIcon size={16} /> End: <span className="font-bold">{formatDateSafe(sub.end_date)}</span>
										</div>
									)}
									{formatDateSafe(sub.actual_date) && (
										<div
											onClick={() => {
												setBulkAction("actual_date");
												setSelectedTasks([sub]);
											}}
											className="hidden md:flex gap-1 hover:cursor-pointer"
										>
											<Target size={16} /> Actual: <span className="font-bold">{formatDateSafe(sub.actual_date)}</span>
										</div>
									)}
									{sub.attachments && sub.attachments.length > 0 && (
										<span title="Attachments">
											<Paperclip className="text-sm text-gray-500" size={16} />
										</span>
									)}
									{taskDiscussions?.filter((d) => d.task_id === sub.id).length > 0 && (
										<span title="Task Discussions">
											<MessageSquareMore className="text-sm text-gray-500" size={16} />
										</span>
									)}
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<div className="flex flex-col md:flex-row items-center justify-end gap-2">
									{sub.status && (
										<span
											title={sub.status?.name || "No status"}
											className={`min-w-fit px-1 rounded-md text-xs hover:cursor-pointer ${
												statusColors?.[sub.status?.color?.toLowerCase()]
											}`}
											onClick={() => {
												setBulkAction("status");
												setSelectedTasks([sub]);
											}}
										>
											{sub.status?.name}
										</span>
									)}
									{sub.priority && (
										<span
											title={sub.priority || "No priority"}
											className={`min-w-fit px-1 rounded-md text-xs hover:cursor-pointer ${priorityColors?.[sub.priority]}`}
											onClick={() => {
												setBulkAction("priority");
												setSelectedTasks([sub]);
											}}
										>
											{sub.priority}
										</span>
									)}
									{sub.category && (
										<span
											title={sub.category?.name || "No priority"}
											className={`min-w-fit px-1 rounded-md text-xs hover:cursor-pointer bg-background/50 border-2 border-foreground/50 text-foreground`}
											onClick={() => {
												setBulkAction("category");
												setSelectedTasks([sub]);
											}}
										>
											{sub.category?.name}
										</span>
									)}
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
										onClick={() => {
											setBulkAction("delete");
											setSelectedTasks([sub]);
										}}
										className="flex gap-2 items-center px-2 py-1 text-xs rounded bg-destructive/10 hover:bg-destructive/20"
									>
										<Trash2 size={12} className="text-destructive" />
										<span className="hidden sm:inline">Delete</span>
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
			{bulkAction === "delete" && deleteDialogOpen ? (
				<DeleteDialog
					dialogOpen={deleteDialogOpen}
					setDialogOpen={handleDeleteDialogClose}
					selectedTasks={selectedTasks}
					clearSelection={clearSelection}
				/>
			) : (
				<UpdateDialog open={!!bulkAction} onClose={() => setBulkAction(null)} action={bulkAction} selectedTasks={selectedTasks} />
			)}
		</div>
	);
}
