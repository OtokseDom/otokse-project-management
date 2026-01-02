import React, { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import debounce from "lodash.debounce";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useAppStore } from "@/store/appStore";
import TaskGridItem from "./gridItem";
import { Skeleton } from "@/components/ui/skeleton";
import { API } from "@/constants/api";
import axiosClient from "@/axios.client";
import { Input } from "@/components/ui/input";

export default function GridList({ tasks, setIsOpen, setUpdateData, setParentId, deleteDialogOpen, setDeleteDialogOpen, context, contextId }) {
	const { tasksLoading, setTaskPositions, updateTaskPositionLocal, getSortedTasks, positionsLoaded, setPositionsLoaded } = useTasksStore();

	const [activeId, setActiveId] = useState(null);
	const [searchValue, setSearchValue] = useState("");
	const [searchTasks, setSearchTasks] = useState([]);

	// Compute key for this context
	const ctxKey = `${context}-${contextId ?? "null"}`;
	const loaded = !!positionsLoaded[ctxKey];

	// Fetch positions on mount or when context/contextId changes, but only if not loaded already
	useEffect(() => {
		let cancelled = false;
		const fetchPositions = async () => {
			// if already loaded for this context, skip fetching
			if (loaded) return setPositionsLoaded(context, contextId, true);
			try {
				const response = await axiosClient.get(API().task_positions_get(context, contextId));
				if (!cancelled && response.data.data) {
					setTaskPositions(context, contextId, response.data.data);
					setPositionsLoaded(context, contextId, true);
				}
			} catch (error) {
				console.error("Failed to fetch task positions:", error);
			}
		};

		fetchPositions();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [context, contextId, setTaskPositions, setPositionsLoaded, loaded]);

	if (!tasks) return null;

	// Get sorted tasks using store helper
	const sortedTasks = getSortedTasks(tasks, context, contextId);

	// Use filtered tasks if search is active, otherwise use all sorted tasks
	const displayTasks = searchValue.trim() ? searchTasks : sortedTasks;
	const sortableIds = displayTasks.map((t) => `grid-item-${t.id}`);

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
		const newPosition = overIndex + 1;

		// Optimistic update - calculate affected tasks locally first
		const affectedPositions = [];
		affectedPositions.push({
			task_id: activeTask.id,
			position: newPosition,
		});

		// Calculate which tasks are affected based on movement direction
		if (activeIndex < overIndex) {
			// Moving down: tasks between activeIndex and overIndex shift up
			for (let i = activeIndex + 1; i <= overIndex; i++) {
				affectedPositions.push({
					task_id: sortedTasks[i].id,
					position: i,
				});
			}
		} else {
			// Moving up: tasks between overIndex and activeIndex shift down
			for (let i = overIndex; i < activeIndex; i++) {
				affectedPositions.push({
					task_id: sortedTasks[i].id,
					position: i + 2,
				});
			}
		}

		// Optimistic update in store
		updateTaskPositionLocal(context, contextId, affectedPositions);

		try {
			// Get all task IDs in current context to ensure backend can create missing positions
			const allTaskIds = sortedTasks.map((t) => t.id);

			// Call backend to persist position
			const response = await axiosClient.patch(API().task_positions_update(), {
				task_id: activeTask.id,
				context: context,
				context_id: contextId || null,
				position: newPosition,
				task_ids: allTaskIds,
			});

			// Backend returns all affected positions, merge them
			if (response.data.data && Array.isArray(response.data.data)) {
				const backendPositions = response.data.data.map((pos) => ({
					task_id: pos.task_id,
					position: pos.position,
				}));
				updateTaskPositionLocal(context, contextId, backendPositions);
				// mark as loaded since now DB has positions for this context
				setPositionsLoaded(context, contextId, true);
			}
		} catch (error) {
			console.error("Failed to update task position:", error);
			// Refetch positions on error (only if previously not loaded or to reconcile state)
			try {
				const response = await axiosClient.get(API().task_positions_get(context, contextId));
				if (response.data.data) {
					setTaskPositions(context, contextId, response.data.data);
					setPositionsLoaded(context, contextId, true);
				}
			} catch (e) {
				console.error("Failed to refetch positions:", e);
			}
		} finally {
			setActiveId(null);
		}
	}, 50);

	// Update search results whenever search value or sorted tasks change
	useEffect(() => {
		if (searchValue.trim()) {
			const searchResults = sortedTasks.filter((task) => {
				return task.title.toLowerCase().includes(searchValue.toLowerCase());
			});
			setSearchTasks(searchResults);
		}
	}, [searchValue]);

	if (tasksLoading || !loaded) {
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
		<div className="w-full h-96 overflow-auto scrollbar-custom mt-10">
			<Input placeholder={"Search title ..."} value={searchValue} onChange={(event) => setSearchValue(event.target.value)} className="max-w-sm" />
			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={debouncedHandleDragEnd}>
				<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
					<div className="flex flex-col gap-2 w-full mt-4">
						{displayTasks.length > 0 ? (
							displayTasks.map((task) => (
								<TaskGridItem
									key={task.id}
									task={task}
									setIsOpen={setIsOpen}
									setUpdateData={setUpdateData}
									setParentId={setParentId}
									deleteDialogOpen={deleteDialogOpen}
									setDeleteDialogOpen={setDeleteDialogOpen}
								/>
							))
						) : searchValue ? (
							<div className="text-center text-muted-foreground py-8">No tasks found matching "{searchValue}"</div>
						) : (
							<div className="text-center text-muted-foreground py-8">No tasks found</div>
						)}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}
