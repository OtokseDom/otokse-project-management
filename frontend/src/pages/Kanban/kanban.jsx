import { useEffect, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, KeyboardSensor, closestCorners, TouchSensor } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Container from "./container";
import Items from "./items";
import debounce from "lodash.debounce";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";
import { API } from "@/constants/api";
import axiosClient from "@/axios.client";

// TODO: Status menu - sorting options
export default function KanbanBoard() {
	const { tasks, taskHistory, updateTaskPosition, addTaskHistory, mergeTaskPositions } = useTasksStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { selectedProject } = useProjectsStore();
	const { kanbanColumns, updateKanbanColumns } = useKanbanColumnsStore();
	const [containers, setContainers] = useState([]);

	useEffect(() => {
		// filter kanban columns for the selected project
		const projectColumns = kanbanColumns.filter((col) => col.project_id === selectedProject?.id).sort((a, b) => a.position - b.position); // enforce ordering
		const mapped = projectColumns
			.map((col) => {
				const status = taskStatuses.find((s) => s.id === col.task_status_id);
				if (!status) return null; // skip if no matching status

				return {
					id: `container-${status.id}`, // string
					column: col.id,
					title: status.name,
					color: status.color,
					position: col.position,
					items: tasks
						.filter((task) => task.status_id === status.id && task.project_id === selectedProject.id && task.children === null) // only top-level tasks
						.sort((a, b) => a.position - b.position) // <-- order by position
						.map((task) => ({
							...task, // include all original task fields
							id: `item-${task.id}`, // override id
						})),
				};
			})
			.filter(Boolean);

		setContainers(mapped);
	}, [taskStatuses, tasks, selectedProject, kanbanColumns]);

	const [activeId, setActiveId] = useState(null);
	const [currentContainerId, setCurrentContainerId] = useState();

	// Find the value of the items
	function findValueOfItems(id, type) {
		if (type === "container") {
			return containers.find((item) => item.id === id);
		}
		if (type === "item") {
			return containers.find((container) => container.items.find((item) => item.id === id));
		}
	}

	/* -------------------------------------------------------------------------- */
	/*                                 DND handlers                               */
	/* -------------------------------------------------------------------------- */
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
		useSensor(TouchSensor, {
			activationConstraint: {
				distance: 5, // minimum movement to start drag
			},
		})
	);

	const handleDragStart = ({ active }) => {
		const { id } = active;
		setActiveId(id);
	};

	const handleDragMove = ({ active, over }) => {
		// Handle item sorting
		if (active.id.toString().includes("item") && over?.id.toString().includes("item") && active && over && active.id !== over.id) {
			// Find the active container and over container
			const activeContainer = findValueOfItems(active.id, "item");
			const overContainer = findValueOfItems(over.id, "item");

			// If the active and over container is undefined, return
			if (!activeContainer || !overContainer) return;

			// Find the active and over container index
			const activeContainerIndex = containers.findIndex((container) => container.id === activeContainer.id);
			const overContainerIndex = containers.findIndex((container) => container.id === overContainer.id);

			// Find the active and over item index
			const activeItemIndex = activeContainer.items.findIndex((item) => item.id === active.id);
			const overItemIndex = overContainer.items.findIndex((item) => item.id === over.id);

			// In the same container
			if (activeContainerIndex === overContainerIndex) {
				let newItems = [...containers];
				newItems[activeContainerIndex].items = arrayMove(newItems[activeContainerIndex].items, activeItemIndex, overItemIndex);

				setContainers(newItems);
			} else {
				// In different container
				let newItems = [...containers];
				const [removedItem] = newItems[activeContainerIndex].items.splice(activeItemIndex, 1);
				newItems[overContainerIndex].items.splice(overItemIndex, 0, removedItem);
				setContainers(newItems);
			}
		}

		// Handling Item Drop into a container
		if (active.id.toString().includes("item") && over?.id.toString().includes("container") && active && over && active.id !== over.id) {
			// Find the active and over container
			const activeContainer = findValueOfItems(active.id, "item");
			const overContainer = findValueOfItems(over.id, "container");

			// If the active or over container is undefined, return
			if (!activeContainer || !overContainer) return;

			// Find the index of active and over container
			const activeContainerIndex = containers.findIndex((container) => container.id === activeContainer.id);
			const overContainerIndex = containers.findIndex((container) => container.id === overContainer.id);

			// Find the index of the active item in the active container
			const activeItemIndex = activeContainer.items.findIndex((item) => item.id === active.id);

			// Remove the active item from the active container and add it to the over container
			let newItems = [...containers];
			const [removedItem] = newItems[activeContainerIndex].items.splice(activeItemIndex, 1);
			newItems[overContainerIndex].items.push(removedItem);
			setContainers(newItems);
		}
	};
	// Wrap with debounce (10ms delay)
	const debouncedHandleDragMove = debounce(handleDragMove, 10);

	const handleDragEnd = async ({ active, over }) => {
		setActiveId(null);
		if (!active || !over) return;

		/* ----------------------- Handling Container Sorting ----------------------- */
		if (active.id.toString().includes("container") && over?.id.toString().includes("container") && active && over && active.id !== over.id) {
			const activeContainerIndex = containers.findIndex((c) => c.id === active.id);
			const overContainerIndex = containers.findIndex((c) => c.id === over.id);

			if (activeContainerIndex === -1 || overContainerIndex === -1) return;

			// Optimistically update the state locally
			const newContainers = arrayMove([...containers], activeContainerIndex, overContainerIndex);
			setContainers(newContainers);

			const activeContainer = containers[activeContainerIndex];
			const overContainer = containers[overContainerIndex];
			try {
				const kanbanColumnId = parseInt(activeContainer.column);
				// Call backend API to shift positions
				const res = await axiosClient.patch(API().kanban_column(kanbanColumnId), {
					position: overContainer.position, // send the new position
				});
				// Re-map backend columns into DnD containers format
				const projectColumns = res.data.data.filter((col) => col.project_id === selectedProject.id).sort((a, b) => a.position - b.position);

				// For store (only column info, int ids, no items)
				const mappedForStore = projectColumns
					.map((col) => {
						const status = taskStatuses.find((s) => s.id === col.task_status_id);
						if (!status) return null;

						return {
							id: col.id, // int
							organization_id: col.organization_id,
							task_status_id: col.task_status_id,
							project_id: col.project_id,
							position: col.position,
							created_at: col.created_at,
							updated_at: col.updated_at,
						};
					})
					.filter(Boolean);

				// For DnD (full items, string ids)
				const mappedForDnD = projectColumns
					.map((col) => {
						const status = taskStatuses.find((s) => s.id === col.task_status_id);
						if (!status) return null;

						return {
							id: `container-${status.id}`, // string
							column: col.id,
							title: status.name,
							color: status.color,
							position: col.position,
							items: tasks
								.filter((task) => task.status_id === status.id && task.project_id === selectedProject.id)
								.sort((a, b) => a.position - b.position)
								.map((task) => ({
									id: `item-${task.id}`, // string
									...task, // include all original task fields
								})),
						};
					})
					.filter(Boolean);

				// Apply updates
				updateKanbanColumns(selectedProject.id, mappedForStore); // store: ints, no items
				setContainers(mappedForDnD); // DnD: strings + items
			} catch (error) {
				console.error("Failed to swap columns:", error);
			}
		}

		/* -------------------------- Handling item Sorting ------------------------- */
		if (active.id.includes("item")) {
			const activeTaskId = parseInt(active.id.replace("item-", ""));
			const task = tasks.find((t) => t.id === activeTaskId);
			if (!task) return;

			let newStatusId;
			let newPosition;

			if (over.id.includes("item")) {
				// dropped over another item
				const overContainer = findValueOfItems(over.id, "item");
				const overItemIndex = overContainer.items.findIndex((i) => i.id === over.id);

				newStatusId = parseInt(overContainer.id.replace("container-", ""));
				newPosition = overItemIndex + 1;
			} else if (over.id.includes("container")) {
				// dropped into empty container
				const overContainer = findValueOfItems(over.id, "container");
				newStatusId = parseInt(overContainer.id.replace("container-", ""));
				newPosition = overContainer.items.length + 1;
			} else {
				return;
			}

			// Check: if nothing actually changed, skip
			if (task.status_id === newStatusId && task.position === newPosition) {
				return;
			}
			// Checkk: if moved to another column (status change)
			const movedToAnotherColumn = task.status_id !== newStatusId;
			// 1. Optimistic update in Zustand
			updateTaskPosition(activeTaskId, newStatusId, newPosition);

			try {
				// 2. Call backend
				const res = await axiosClient.patch(API().task_move(activeTaskId), {
					status_id: newStatusId,
					position: newPosition,
				});
				// 3.1. Merge backend response
				mergeTaskPositions(res.data.data.tasks);
				// 3.2 Add history since status changed
				if (movedToAnotherColumn) {
					addTaskHistory(res.data.data.history);
				}
			} catch (err) {
				console.error("Failed to update task position:", err);
				// Optional rollback: refetch tasks from API
			}
		}
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCorners}
			onDragStart={handleDragStart}
			onDragMove={debouncedHandleDragMove}
			onDragEnd={handleDragEnd}
		>
			<div className="flex gap-4 py-2 h-full">
				<SortableContext items={containers.map((i) => i.id)}>
					{containers.map((container) => (
						<Container
							key={container.id}
							id={container.id}
							title={container.title}
							color={container.color}
							onAddItem={() => {
								setShowAddItemModal(true);
								setCurrentContainerId(container.id);
							}}
						>
							<SortableContext items={container.items.map((i) => i.id)}>
								{container.items.length === 0 && (
									<div className="py-24 text-sm text-muted-foreground border-2 border-dashed rounded-md text-center cursor-default">
										Drop items here
									</div>
								)}
								<div className="flex items-start flex-col gap-y-2">
									{container.items.map((item) => (
										<Items key={item.id} item={item} />
									))}
								</div>
							</SortableContext>
						</Container>
					))}
				</SortableContext>
			</div>
		</DndContext>
	);
}
