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
	CircleDot,
	Circle,
	GoalIcon,
	GripVertical,
	Paperclip,
	MessageSquareMore,
	ListTodo,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { Progress } from "@/components/ui/progress";
import { getSubtaskProgress, priorityColors, statusColors } from "@/utils/taskHelpers";
import { useTaskDiscussionsStore } from "@/store/taskDiscussions/taskDiscussionsStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useEpicsStore } from "@/store/epics/epicsStore";
import { Link } from "react-router-dom";

export default function EpicGridItem({ epic, setIsOpen = () => {}, setUpdateData = () => {}, checkHasRelation = () => {} }) {
	const { epics, setSelectedEpic } = useEpicsStore();
	const { taskStatuses } = useTaskStatusesStore();
	const [open, setOpen] = useState(false);
	const [selectedEpics, setSelectedEpics] = useState(null);

	// DnD Kit integration
	// const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
	// 	id: `grid-item-${epic.id}`,
	// 	data: {
	// 		type: "grid-item",
	// 		epic: epic,
	// 	},
	// });

	// const hasChildren = Array.isArray(epic.children) && epic.children.length > 0;

	const formatDateSafe = (d) => {
		if (!d) return null;
		try {
			return format(new Date(d), "MMM dd, yyyy");
		} catch {
			return d;
		}
	};

	const endString = epic.end_date ? formatDateSafe(epic.end_date) : null;
	const startString = epic.start_date ? formatDateSafe(epic.start_date) : null;
	const priority = epic.priority ?? null;

	const statusKey = epic.status?.color ? String(epic.status.color).toLowerCase() : null;
	const statusClass = statusColors?.[statusKey] ?? "bg-muted/20 text-muted-foreground";
	const priorityClass = priorityColors?.[priority] ?? "bg-muted/20 text-muted-foreground";

	const handleUpdateEpic = (epic) => {
		setTimeout(() => {
			setIsOpen(true);
			setUpdateData(epic);
		}, 100);
	};
	// const openEdit = (epic) => {
	// 	setUpdateData(epic);
	// 	setIsOpen(true);
	// 	const filteredHistory = taskHistory.filter((th) => th.task_id === epic.id);
	// 	setSelectedTaskHistory(filteredHistory);
	// 	if (!epic.parent_id) {
	// 		setRelations(epic);
	// 	} else {
	// 		const parentTask = tasks.find((t) => t.id == epic.parent_id);
	// 		setRelations(parentTask);
	// 	}
	// };

	// const handleClone = (t) => {
	// 	const cloned = {
	// 		...t,
	// 		id: undefined,
	// 		title: `${t.title} (Clone)`,
	// 		calendar_add: true,
	// 	};
	// 	setUpdateData(cloned);
	// 	setIsOpen(true);
	// };

	// const handleAddSubtask = (parent) => {
	// 	setParentId(parent.id);
	// 	setEpicId(parent.epic_id || null);
	// 	setUpdateData({}); // empty payload for new subtask
	// 	setIsOpen(true);
	// };

	// const handleDelete = async (t) => {
	// 	if (!confirm("Delete epic? This cannot be undone.")) return;
	// 	setLoading(true);
	// 	try {
	// 		await axiosClient.delete(API().epic(t.id));
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
	// useEffect(() => {
	// 	if (bulkAction === "delete") {
	// 		setDeleteDialogOpen(true);
	// 	}
	// }, [bulkAction]);

	// const handleDeleteDialogClose = (open) => {
	// 	setDeleteDialogOpen(open);
	// 	if (!open) setBulkAction(null);
	// };
	// // Helper to clear selection and reset dialogs
	// const clearSelection = () => {
	// 	setSelectedEpics(null);
	// 	setBulkAction(null);
	// 	setDeleteDialogOpen(false);
	// };

	// compute subtask progress for this epic
	// const { text: subtaskProgressText, value: subtaskProgressValue } = getSubtaskProgress(epic, taskStatuses);

	return (
		<div
			// ref={setNodeRef}
			// style={{
			// 	transform: CSS.Translate.toString(transform),
			// 	transition,
			// 	opacity: isDragging ? 0.5 : 1,
			// }}
			className="bg-sidebar text-card-foreground border border-border rounded-lg p-4 flex flex-col shadow-sm w-full"
		>
			{/* Header */}
			{/* <div
				className="w-full py-1 hover:cursor-grab active:cursor-grabbing"
				// {...listeners} {...attributes}
			>
				<GripVertical size={16} />
			</div> */}
			<div className="flex flex-col md:flex-row items-start justify-between gap-2">
				<div className="min-w-0 flex flex-col order-2 md:order-1 gap-2">
					<h3 className="text-lg font-bold">{epic.title || "Untitled epic"}</h3>
					{epic.slug ? <div className="text-xs text-muted-foreground">{epic.slug}</div> : ""}
					<div
						className="text-xs text-muted-foreground prose prose-sm max-w-none
												 			[&_ul]:list-disc [&_ul]:pl-6
															[&_ol]:list-decimal [&_ol]:pl-6
															[&_li]:my-1"
						dangerouslySetInnerHTML={{ __html: epic.description }}
					/>
				</div>
				<div className="flex flex-col order-1 md:order-2 justify-end gap-1">
					<div className="flex flex-row justify-end gap-2">
						{/* status pill uses statusColors mapping */}
						{epic.status?.name ? (
							<span
								onClick={() => {
									setBulkAction("status");
									setSelectedEpics([epic]);
								}}
								className={`text-xs min-w-fit px-2 py-1 rounded-full font-medium hover:cursor-pointer ${statusClass}`}
							>
								{epic.status.name}
							</span>
						) : (
							""
						)}
						{priority && (
							<span
								onClick={() => {
									setBulkAction("priority");
									setSelectedEpics([epic]);
								}}
								className={`text-xs min-w-fit px-2 py-1 rounded-full font-medium hover:cursor-pointer ${priorityClass}`}
							>
								{priority}
							</span>
						)}
					</div>
				</div>
			</div>
			<hr className="mt-2" />
			{/* Details row */}
			<div className="flex flex-col mt-3 gap-2 items-start">
				{/* left column: metadata */}
				<div className="flex flex-col md:flex-row w-full justify-between items-center">
					{/* dates */}
					<div className="flex flex-wrap text-xs text-muted-foreground gap-4">
						{startString && (
							<div
								onClick={() => {
									setBulkAction("start_date");
									setSelectedEpics([epic]);
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
									setSelectedEpics([epic]);
								}}
								className="flex gap-1 hover:cursor-pointer"
							>
								<CalendarDaysIcon size={16} /> End: <span className="text-card-foreground">{endString}</span>
							</div>
						)}
					</div>
					{/* Actions */}
					<div className="flex w-full md:w-fit justify-end gap-2">
						<Button variant="ghost" size="sm" title="Edit" onClick={() => handleUpdateEpic(epic)}>
							<Edit size={12} />
							<span className="hidden sm:inline text-xs">Edit</span>
						</Button>
						<Link
							to={`/epics/${epic.id}`}
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							<Button variant="ghost" title={`View ${epic.title}`}>
								<ListTodo />
								<span className="hidden sm:inline text-xs">View Epic</span>
							</Button>
						</Link>
						<Button
							variant="ghost"
							size="sm"
							title="Delete"
							onClick={() => {
								checkHasRelation(epic);
							}}
						>
							<Trash2 size={12} className="text-destructive" />
							<span className="hidden sm:inline text-xs">Delete</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
