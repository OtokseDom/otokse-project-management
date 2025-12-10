import React, { useEffect, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import debounce from "lodash.debounce";
import { useAppStore } from "@/store/appStore";
import { Skeleton } from "@/components/ui/skeleton";
import { API } from "@/constants/api";
import axiosClient from "@/axios.client";
import ProjectGridItem from "./gridItem";
import { useProjectsStore } from "@/store/projects/projectsStore";

export default function GridList({ projects, setIsOpen, setUpdateData, checkHasRelation, setDialogOpen, dialogOpen, hasRelation }) {
	// const { tasksLoading, setTaskPositions, updateTaskPositionLocal, getSortedTasks, positionsLoaded, setPositionsLoaded } = useTasksStore();
	const { projectsLoading } = useProjectsStore();

	/* -------------------------------------------------------------------------- */
	/*                                DND Functions                               */
	/* -------------------------------------------------------------------------- */
	// const [activeId, setActiveId] = useState(null);

	// // Compute key for this context
	// const ctxKey = `${context}-${contextId ?? "null"}`;
	// const loaded = !!positionsLoaded[ctxKey];

	// // Fetch positions on mount or when context/contextId changes, but only if not loaded already
	// useEffect(() => {
	// 	let cancelled = false;
	// 	const fetchPositions = async () => {
	// 		// if already loaded for this context, skip fetching
	// 		if (loaded) return setPositionsLoaded(context, contextId, true);
	// 		try {
	// 			const response = await axiosClient.get(API().task_positions_get(context, contextId));
	// 			if (!cancelled && response.data.data) {
	// 				setTaskPositions(context, contextId, response.data.data);
	// 				setPositionsLoaded(context, contextId, true);
	// 			}
	// 		} catch (error) {
	// 			console.error("Failed to fetch task positions:", error);
	// 		}
	// 	};

	// 	fetchPositions();
	// 	return () => {
	// 		cancelled = true;
	// 	};
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [context, contextId, setTaskPositions, setPositionsLoaded, loaded]);

	// if (!projects) return null;

	// // Get sorted projects using store helper
	// const sortedTasks = getSortedTasks(projects, context, contextId);
	// const sortableIds = sortedTasks.map((t) => `grid-item-${t.id}`);

	// const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

	// const handleDragStart = ({ active }) => {
	// 	setActiveId(active.id);
	// };

	// const debouncedHandleDragEnd = debounce(async ({ active, over }) => {
	// 	if (!active || !over || active.id === over.id) {
	// 		setActiveId(null);
	// 		return;
	// 	}

	// 	const activeIndex = sortedTasks.findIndex((t) => `grid-item-${t.id}` === active.id);
	// 	const overIndex = sortedTasks.findIndex((t) => `grid-item-${t.id}` === over.id);

	// 	if (activeIndex === -1 || overIndex === -1) {
	// 		setActiveId(null);
	// 		return;
	// 	}

	// 	const activeTask = sortedTasks[activeIndex];
	// 	const newPosition = overIndex + 1;

	// 	// Optimistic update - calculate affected projects locally first
	// 	const affectedPositions = [];
	// 	affectedPositions.push({
	// 		task_id: activeTask.id,
	// 		position: newPosition,
	// 	});

	// 	// Calculate which projects are affected based on movement direction
	// 	if (activeIndex < overIndex) {
	// 		// Moving down: projects between activeIndex and overIndex shift up
	// 		for (let i = activeIndex + 1; i <= overIndex; i++) {
	// 			affectedPositions.push({
	// 				task_id: sortedTasks[i].id,
	// 				position: i,
	// 			});
	// 		}
	// 	} else {
	// 		// Moving up: projects between overIndex and activeIndex shift down
	// 		for (let i = overIndex; i < activeIndex; i++) {
	// 			affectedPositions.push({
	// 				task_id: sortedTasks[i].id,
	// 				position: i + 2,
	// 			});
	// 		}
	// 	}

	// 	// Optimistic update in store
	// 	updateTaskPositionLocal(context, contextId, affectedPositions);

	// 	try {
	// 		// Get all task IDs in current context to ensure backend can create missing positions
	// 		const allTaskIds = sortedTasks.map((t) => t.id);

	// 		// Call backend to persist position
	// 		const response = await axiosClient.patch(API().task_positions_update(), {
	// 			task_id: activeTask.id,
	// 			context: context,
	// 			context_id: contextId || null,
	// 			position: newPosition,
	// 			task_ids: allTaskIds,
	// 		});

	// 		// Backend returns all affected positions, merge them
	// 		if (response.data.data && Array.isArray(response.data.data)) {
	// 			const backendPositions = response.data.data.map((pos) => ({
	// 				task_id: pos.task_id,
	// 				position: pos.position,
	// 			}));
	// 			updateTaskPositionLocal(context, contextId, backendPositions);
	// 			// mark as loaded since now DB has positions for this context
	// 			setPositionsLoaded(context, contextId, true);
	// 		}
	// 	} catch (error) {
	// 		console.error("Failed to update task position:", error);
	// 		// Refetch positions on error (only if previously not loaded or to reconcile state)
	// 		try {
	// 			const response = await axiosClient.get(API().task_positions_get(context, contextId));
	// 			if (response.data.data) {
	// 				setTaskPositions(context, contextId, response.data.data);
	// 				setPositionsLoaded(context, contextId, true);
	// 			}
	// 		} catch (e) {
	// 			console.error("Failed to refetch positions:", e);
	// 		}
	// 	} finally {
	// 		setActiveId(null);
	// 	}
	// }, 50);

	if (projectsLoading) {
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
			{/* <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={debouncedHandleDragEnd}>
				<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}> */}
			<div className="flex flex-col gap-4 w-full">
				{projects.map((project) => (
					<ProjectGridItem
						key={project.id}
						project={project}
						setIsOpen={setIsOpen}
						setUpdateData={setUpdateData}
						checkHasRelation={checkHasRelation}
						dialogOpen={dialogOpen}
						setDialogOpen={setDialogOpen}
						hasRelation={hasRelation}
					/>
				))}
			</div>
			{/* </SortableContext>
			</DndContext> */}
		</div>
	);
}
