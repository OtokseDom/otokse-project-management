import React, { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useUserStore } from "@/store/user/userStore";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CornerDownRight, Paperclip, Text } from "lucide-react";
import TaskForm from "../form";

/**
 * ClickUp-like List View page.
 * - Groups by parent tasks (top-level tasks with subtasks)
 * - Allows dragging a task and dropping onto a different parent (or "No Parent")
 * - On drop, calls PATCH /v1/task/{id} with { parent_id, organization_id } and refreshes tasks
 */

const DraggableTask = ({ task, onOpenEdit }) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: `task-${task.id}`,
		data: { type: "task", taskId: task.id, parentId: task.parent_id ?? null },
	});
	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			className={clsx(
				"p-2 bg-sidebar-accent shadow rounded-md border border-transparent hover:border-foreground cursor-grab",
				isDragging && "opacity-50"
			)}
		>
			<div className="flex items-start justify-between">
				<div className="flex items-start gap-2">
					{task.depth === 1 ? <CornerDownRight size={18} /> : null}
					<div>
						<div className="font-medium">{task.title}</div>
						<div className="text-xs text-muted-foreground flex gap-2 items-center">
							{task.description ? <Text size={14} /> : null}
							{task.attachments && task.attachments.length > 0 ? <Paperclip size={14} /> : null}
						</div>
					</div>
				</div>
				<Button
					size="sm"
					variant="ghost"
					onClick={(e) => {
						e.stopPropagation();
						onOpenEdit(task);
					}}
				>
					Edit
				</Button>
			</div>
		</div>
	);
};

const DroppableParent = ({ parentTask, childrenTasks, onDropToParent, onOpenEdit, isTopLevelBucket }) => {
	// id for droppable: parent-{id} or parent-null for top-level
	const droppableId = isTopLevelBucket ? "parent-null" : `parent-${parentTask.id}`;
	const { isOver, setNodeRef } = useDroppable({ id: droppableId });

	return (
		<div ref={setNodeRef} className={clsx("p-3 rounded-md border", isOver ? "border-blue-500 bg-blue-50" : "border-transparent")}>
			{/* Parent header */}
			<div className="flex items-center justify-between mb-2">
				<div>
					{isTopLevelBucket ? (
						<div className="text-sm font-semibold">No Parent (Top-level tasks)</div>
					) : (
						<>
							<div className="text-sm font-semibold">{parentTask.title}</div>
							<div className="text-xs text-muted-foreground">{parentTask.description}</div>
						</>
					)}
				</div>
				<div className="flex gap-2">
					<Button size="sm" variant="outline" onClick={() => onOpenEdit(parentTask)}>
						Open
					</Button>
				</div>
			</div>

			{/* Children list */}
			<div className="flex flex-col gap-2">
				{childrenTasks.map((t) => (
					<DraggableTask key={t.id} task={t} onOpenEdit={onOpenEdit} />
				))}
			</div>

			{/* Drop hint */}
			{childrenTasks.length === 0 && <div className="mt-3 text-xs text-muted-foreground">Drop tasks here to make them subtasks</div>}
		</div>
	);
};

export default function TasksListView() {
	const { tasks } = useTasksStore();
	const { fetchTasks } = useTaskHelpers();
	const { user } = useUserStore();
	const { setLoading } = useLoadContext();
	const [isOpen, setIsOpen] = useState(false);
	const [editTask, setEditTask] = useState(null);
	const [dragging, setDragging] = useState(false);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

	useEffect(() => {
		// ensure tasks are loaded
		if (tasks === null || tasks.length === 0) {
			fetchTasks();
		}
	}, []);

	// Build grouped structure: parents (top-level tasks: parent_id == null) with their children
	const grouped = useMemo(() => {
		if (!tasks) return { parents: [], orphans: [] };
		// Map tasks by id
		const byId = new Map(tasks.map((t) => [t.id, t]));
		// group children
		const parents = [];
		const orphanChildren = [];
		tasks.forEach((t) => {
			if (!t.parent_id) {
				parents.push({ ...t, children: [] });
			}
		});
		// attach children to parent clones
		tasks.forEach((t) => {
			if (t.parent_id) {
				const parent = parents.find((p) => p.id === t.parent_id);
				if (parent) {
					parent.children.push({ ...t, depth: 1 });
				} else {
					// parent missing (could be filtered out) => treat as top-level orphan
					orphanChildren.push({ ...t, depth: 0 });
				}
			}
		});
		// ensure parents themselves include depth 0
		const parentsWithDepth = parents.map((p) => ({ ...p, depth: 0 }));
		// Also include any top-level tasks that have no children (already in parents)
		return { parents: parentsWithDepth, orphans: orphanChildren };
	}, [tasks]);

	const openEdit = (task) => {
		setEditTask(task);
		setIsOpen(true);
	};

	const handleDragStart = () => setDragging(true);
	const handleDragEnd = async (event) => {
		setDragging(false);
		const { active, over } = event;
		setLoading(true);
		try {
			if (!active || !over) return;
			// active.id = task-{id}
			if (!String(active.id).startsWith("task-")) return;
			const taskId = parseInt(String(active.id).replace("task-", ""), 10);

			// over.id = parent-{id} or parent-null
			if (!String(over.id).startsWith("parent-")) return;
			const raw = String(over.id).replace("parent-", "");
			const newParentId = raw === "null" ? null : parseInt(raw, 10);

			// find the task in current state
			const t = tasks.find((x) => x.id === taskId);
			if (!t) return;

			// if no change, skip
			if ((t.parent_id ?? null) === newParentId) return;

			// Call backend: patch task with new parent_id and organization_id (backend expects organization check)
			await axiosClient.patch(API().task(taskId), {
				parent_id: newParentId,
				organization_id: user?.organization_id,
			});
			// refresh tasks
			await fetchTasks();
		} catch (e) {
			console.error("Failed to move subtask:", e);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full p-4 bg-card text-card-foreground rounded-2xl">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h1 className="text-2xl font-extrabold">List View</h1>
					<p className="text-sm text-muted-foreground">Grouped by parent tasks. Drag tasks onto a parent to make them subtasks.</p>
				</div>
				<div className="flex gap-2">
					<Button onClick={() => fetchTasks()}>Refresh</Button>
				</div>
			</div>

			<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
				<div className="grid grid-cols-1 gap-4">
					{/* Top-level "No Parent" bucket */}
					<DroppableParent
						isTopLevelBucket
						parentTask={null}
						childrenTasks={(tasks || []).filter((t) => !t.parent_id && !t.depth).map((t) => ({ ...t, depth: 0 }))}
						onDropToParent={() => {}}
						onOpenEdit={openEdit}
					/>

					{/* Parent groups */}
					{grouped.parents.map((parent) => (
						<div key={`group-${parent.id}`} className="rounded-md">
							<DroppableParent
								parentTask={parent}
								childrenTasks={(parent.children || []).map((c) => c)}
								onDropToParent={() => {}}
								onOpenEdit={openEdit}
							/>
						</div>
					))}

					{/* Orphans if any */}
					{grouped.orphans.length > 0 && (
						<div>
							<div className="text-sm font-semibold mb-2">Orphaned subtasks</div>
							<div className="flex flex-col gap-2">
								{grouped.orphans.map((t) => (
									<DraggableTask key={`orphan-${t.id}`} task={t} onOpenEdit={openEdit} />
								))}
							</div>
						</div>
					)}
				</div>
			</DndContext>

			{/* Edit sheet */}
			<Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
				<SheetTrigger asChild>
					{/* hidden trigger; the sheet is controlled via setIsOpen */}
					<div style={{ display: "none" }} />
				</SheetTrigger>
				<SheetContent side="right" className="w-full sm:w-[640px] overflow-y-auto">
					<SheetHeader>
						<SheetTitle>Edit Task</SheetTitle>
					</SheetHeader>
					{editTask && (
						<TaskForm isOpen={isOpen} setIsOpen={setIsOpen} updateData={editTask} setUpdateData={() => {}} parentId={editTask.parent_id} />
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
