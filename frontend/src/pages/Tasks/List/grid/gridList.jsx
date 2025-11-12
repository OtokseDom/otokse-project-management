import React from "react";
import { useTasksStore } from "@/store/tasks/tasksStore";
import TaskGridItem from "./gridItem";

export default function GridList({ setIsOpen, setUpdateData, setParentId, setProjectId }) {
	// tasks are expected to include parent_id (null for parents) and children array for subtasks
	const { tasks } = useTasksStore();

	if (!tasks) return null;

	// show only top-level tasks (parents)
	const parentTasks = tasks.filter((t) => !t.parent_id);

	return (
		<div className="w-full scrollbar-custom mt-10">
			{/* single column full-span list so each card has maximum horizontal room */}
			<div className="flex flex-col gap-4 w-full">
				{parentTasks.map((task) => (
					<TaskGridItem
						key={task.id}
						task={task}
						// pass same handlers used by datatable so the same form/dialog is reused
						setIsOpen={setIsOpen}
						setUpdateData={setUpdateData}
						setParentId={setParentId}
						setProjectId={setProjectId}
					/>
				))}
			</div>
		</div>
	);
}
