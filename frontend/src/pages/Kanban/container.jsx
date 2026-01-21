import React, { useEffect, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { statusColors, useTaskHelpers } from "@/utils/taskHelpers";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import History from "@/components/task/History";
import Relations from "@/components/task/Relations";
import TaskForm from "../Tasks/form";
import { useTasksStore } from "@/store/tasks/tasksStore";
import Tabs from "@/components/task/Tabs";
import { useProjectsStore } from "@/store/projects/projectsStore";

const Container = ({ id, children, title, color, onAddItem }) => {
	// Task Form
	const { selectedProject } = useProjectsStore();
	const { selectedTaskHistory, setRelations, activeTab, setActiveTab, tasksLoading } = useTasksStore();
	const { fetchTasks } = useTaskHelpers();
	const [isOpenDialog, setIsOpenDialog] = useState(null);
	const [updateData, setUpdateData] = useState({});
	const [taskAdded, setTaskAdded] = useState(false);
	const [parentId, setParentId] = useState(null); //for adding subtasks from relations tab

	useEffect(() => {
		if (!isOpenDialog) {
			setRelations({});
			setActiveTab("update");
			setParentId(null);
		}
	}, [isOpenDialog]);

	const { attributes, setNodeRef, listeners, transform, transition, isDragging } = useSortable({
		id: id,
		data: {
			type: "container",
		},
	});
	return (
		<div
			{...attributes}
			ref={setNodeRef}
			style={{
				transition,
				transform: CSS.Translate.toString(transform),
			}}
			className={clsx(
				"min-w-[350px] h-fit min-h-[50vh] max-h-[calc(100vh-9rem)] p-2 bg-secondary border border-accent rounded-xl flex flex-col",
				isDragging && "opacity-50",
			)}
		>
			<div
				className={`fixed inset-0 bg-black bg-opacity-60  z-40 transition-opacity duration-300 pointer-events-none ${
					isOpenDialog ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			{/* Drag Handle */}
			<div className="w-full py-1 hover:cursor-grab active:cursor-grabbing draggable touch-none" {...listeners}>
				<GripVertical size={16} />
			</div>
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex flex-col w-full">
					<h1 className={`px-2 py-1 text-center whitespace-nowrap rounded text-md ${statusColors[color?.toLowerCase()] || ""}`}>{title}</h1>
				</div>
				{/* Drag Handle on empty space */}
				<div className="w-full p-3 hover:cursor-grab active:cursor-grabbing" {...listeners} />
				<Button variant="ghost">
					<MoreHorizontal />
				</Button>
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto flex flex-col gap-y-4">{children}</div>

			{/* Fixed bottom button */}
			<div className="sticky bottom-0 bg-secondary pt-2">
				<Sheet open={isOpenDialog} onOpenChange={setIsOpenDialog} modal={false}>
					<SheetTrigger
						asChild
						onClick={() => {
							setUpdateData({
								kanban_add: true,
								project_id: selectedProject.id !== "undefined" ? selectedProject.id : null,
								status_id: id !== "undefined" ? parseInt(id.replace("container-", ""), 10) : null,
							});
							setIsOpenDialog(true);
						}}
					>
						<Button variant="" className="w-full h-fit">
							Add Item
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
						<SheetHeader>
							<SheetTitle>
								<Tabs loading={tasksLoading} updateData={updateData} activeTab={activeTab} setActiveTab={setActiveTab} parentId={parentId} />
							</SheetTitle>
							<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
						</SheetHeader>
						{activeTab == "history" ? (
							<History selectedTaskHistory={selectedTaskHistory} />
						) : activeTab == "relations" ? (
							<Relations setUpdateData={setUpdateData} setParentId={setParentId} />
						) : (
							<TaskForm
								isOpen={isOpenDialog}
								setIsOpen={setIsOpenDialog}
								updateData={updateData}
								setUpdateData={setUpdateData}
								fetchData={fetchTasks}
								setTaskAdded={setTaskAdded}
								parentId={parentId}
							/>
						)}
					</SheetContent>
				</Sheet>
			</div>
		</div>
	);
};

export default Container;
