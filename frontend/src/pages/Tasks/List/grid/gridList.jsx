import React, { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import debounce from "lodash.debounce";
import { useTasksStore } from "@/store/tasks/tasksStore";
import TaskGridItem from "./gridItem";
import { Skeleton } from "@/components/ui/skeleton";
import { API } from "@/constants/api";
import axiosClient from "@/axios.client";

export default function GridList({ tasks, setIsOpen, setUpdateData, setParentId, setProjectId, deleteDialogOpen, setDeleteDialogOpen, context, contextId }) {
	const { tasksLoading, setTaskPositions, updateTaskPositionLocal, getSortedTasks } = useTasksStore();
	const [activeId, setActiveId] = useState(null);
	const [positionsLoaded, setPositionsLoaded] = useState(false);

	// Fetch positions on mount or when context/contextId changes
	useEffect(() => {
		const fetchPositions = async () => {
			try {
				const response = await axiosClient.get(API().task_positions_get(context, contextId));
				if (response.data.data) {
					setTaskPositions(context, contextId, response.data.data);
				}
			} catch (error) {
				console.error("Failed to fetch task positions:", error);
			} finally {
				setPositionsLoaded(true);
			}
		};

		fetchPositions();
	}, [context, contextId, setTaskPositions]);

	if (!tasks) return null;

	// Get sorted tasks using store helper
	const sortedTasks = getSortedTasks(tasks, context, contextId);
	const sortableIds = sortedTasks.map((t) => `grid-item-${t.id}`);

	const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

	const handleDragStart = ({ active }) => {
		setActiveId(active.id);
	};

	const debouncedHandleDragEnd = debounce(async ({ active, over }) => {
		if (!active || !over || active.id === over.id) {
			setActiveId(null);
			return;
		}

		const activeIndex = sortedTasks.findIndex((t) => `grid-item-${t.id}` === active.id);
		const overIndex = sortedTasks.findIndex((t) => `grid-item-${t.id}` === over.id);

		if (activeIndex === -1 || overIndex === -1) {
			setActiveId(null);
			return;
		}

		const activeTask = sortedTasks[activeIndex];
		const overTask = sortedTasks[overIndex];
		const newPosition = overIndex + 1;

		// Determine affected tasks (all tasks between old and new position)
		const minIndex = Math.min(activeIndex, overIndex);
		const maxIndex = Math.max(activeIndex, overIndex);
		const affectedTasks = [];

		// Build the new position map for affected tasks
		if (activeIndex < overIndex) {
			// Moving down
			for (let i = activeIndex; i < overIndex; i++) {
				affectedTasks.push({
					id: sortedTasks[i + 1].id,
					position: i + 1,
				});
			}
			affectedTasks.push({
				id: activeTask.id,
				position: newPosition,
			});
		} else {
			// Moving up
			for (let i = overIndex + 1; i <= activeIndex; i++) {
				affectedTasks.push({
					id: sortedTasks[i].id,
					position: i + 1,
				});
			}
			affectedTasks.push({
				id: activeTask.id,
				position: newPosition,
			});
		}

		// Optimistic update in store
		updateTaskPositionLocal(activeTask.id, context, contextId, affectedTasks);

		try {
			// Call backend to persist position
			await axiosClient.patch(API().task_positions_update(), {
				task_id: activeTask.id,
				context: context,
				context_id: contextId || null,
				position: newPosition,
			});
		} catch (error) {
			console.error("Failed to update task position:", error);
			// Optionally refetch positions on error
			try {
				const response = await axiosClient.get(API().task_positions_get(context, contextId));
				if (response.data.data) {
					setTaskPositions(context, contextId, response.data.data);
				}
			} catch (e) {
				console.error("Failed to refetch positions:", e);
			}
		} finally {
			setActiveId(null);
		}
	}, 50);

	if (tasksLoading || !positionsLoaded) {
		return (
			<div className="w-full scrollbar-custom mt-10">
				<div className="flex flex-col space-y-2 h-full w-full">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} index={i * 0.9} className="w-full h-44" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="w-full scrollbar-custom mt-10">
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={debouncedHandleDragEnd}>
				<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
					<div className="flex flex-col gap-4 w-full">
						{sortedTasks.map((task) => (
							<TaskGridItem
								key={task.id}
								task={task}
								setIsOpen={setIsOpen}
								setUpdateData={setUpdateData}
								setParentId={setParentId}
								setProjectId={setProjectId}
								deleteDialogOpen={deleteDialogOpen}
								setDeleteDialogOpen={setDeleteDialogOpen}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}
