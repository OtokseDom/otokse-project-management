import { useSortable } from "@dnd-kit/sortable";
import React, { useEffect, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Check, Clock, Edit, GripVertical, Text } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import Relations from "@/components/task/Relations";
import History from "@/components/task/History";
import TaskForm from "../Tasks/form";
import { useTasksStore } from "@/store/tasks/tasksStore";
import Tabs from "@/components/task/Tabs";
import { TaskDiscussions } from "@/components/task/Discussion";

const Items = ({ item }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
		data: {
			type: "item",
		},
	});
	// Task update
	// Need to convert id from "item-1" to "1"
	const itemFormatted = {
		...item,
		id: parseInt(item.id.split("-")[1]),
	};
	const { tasks, taskHistory, selectedTaskHistory, setSelectedTaskHistory, setRelations, activeTab, setActiveTab, tasksLoading } = useTasksStore();

	// const [tasks, setTasks] = useState(tasks);
	const [isDialogOpen, setDialogOpen] = useState(null);
	const [updateData, setUpdateData] = useState({});
	const [taskAdded, setTaskAdded] = useState(false);
	const [parentId, setParentId] = useState(null); //for adding subtasks from relations tab

	useEffect(() => {
		if (!isDialogOpen) {
			setRelations({});
			setActiveTab("update");
			setParentId(null);
		}
	}, [isDialogOpen]);

	// Local today/tomorrow
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);

	// Convert task dates to local
	const startDate = item.start_date ? new Date(item.start_date) : null;
	const endDate = item.end_date ? new Date(item.end_date) : null;

	// Helper functions
	const isBeforeToday = (date) => date < today;
	const isTodayOrTomorrow = (date) => date >= today && date <= tomorrow;

	return (
		<Sheet open={isDialogOpen} onOpenChange={setDialogOpen} modal={false}>
			<SheetTrigger
				asChild
				onClick={(e) => {
					//set update tasks when a task is clicked
					e.stopPropagation();
					setUpdateData(itemFormatted);
					setDialogOpen(true);
					const filteredHistory = taskHistory.filter((th) => th.task_id === itemFormatted.id);
					setSelectedTaskHistory(filteredHistory);
					if (!item.parent_id) {
						setRelations(itemFormatted);
					} else {
						const filteredRelations = tasks.filter((t) => t.id == item.parent_id);
						setRelations(...filteredRelations);
					}
				}}
			>
				<div
					ref={setNodeRef}
					{...attributes}
					style={{
						transition,
						transform: CSS.Translate.toString(transform),
					}}
					className={clsx(
						"p-2 bg-background shadow rounded-md w-full border border-transparent hover:border-foreground cursor-pointer group",
						isDragging && "opacity-50"
					)}
				>
					<div
						className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 cursor-default ${
							isDialogOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
						}`}
						aria-hidden="true"
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
							setDialogOpen(false);
						}}
					/>
					<div className="flex flex-row w-full items-center justify-between draggable touch-none">
						{/* Grip handle */}
						<div className="w-full py-1 hover:cursor-grab active:cursor-grabbing" {...listeners}>
							<GripVertical size={16} />
						</div>

						{/* Edit button */}
						<Button
							variant="ghost"
							onClick={() => console.log("Edit", item.id)}
							className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
							// prevent this button from being draggable
							onMouseDown={(e) => e.stopPropagation()}
							onTouchStart={(e) => e.stopPropagation()}
						>
							<Edit size={16} />
						</Button>
					</div>
					<div className="flex justify-start">
						<Toggle onClick={(e) => e.stopPropagation()} variant="default" size="none" aria-label="Toggle" className="group h-fit py-1">
							<div className="w-0 group-hover:w-7 group-data-[state=on]:w-7 transition-all duration-500 ease-in-out">
								<Check className="aspect-square rounded-full border border-foreground opacity-0 group-hover:opacity-100 group-data-[state=on]:opacity-100 group-data-[state=on]:bg-green-500 transition-all duration-500 ease-in-out" />
							</div>
						</Toggle>
						<div className="w-full text-xs space-y-1">
							<p>{item.title}</p>
							<span className="flex flex-row items-center gap-x-1 text-muted-foreground">
								<span
									className={`flex items-center text-xs gap-x-1 p-1 rounded ${
										endDate && item.status.name === "Completed"
											? "bg-green-300 text-black"
											: endDate && isBeforeToday(endDate)
											? "bg-red-300 text-black" // overdue
											: endDate && isTodayOrTomorrow(endDate)
											? "bg-yellow-700 text-black" // near due
											: ""
									}`}
								>
									{endDate && <Clock size={16} />}
									{startDate && `${startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - `}
									{endDate &&
										endDate.toLocaleDateString(undefined, {
											month: "short",
											day: "numeric",
										})}
								</span>
								{item.description && <Text size={14} className="text-muted-foreground" />}
							</span>
						</div>
					</div>
				</div>
			</SheetTrigger>
			<SheetContent side="right" className="overflow-y-auto w-full sm:w-[640px]">
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
				) : activeTab == "discussions" ? (
					<TaskDiscussions taskId={updateData?.id} />
				) : (
					<TaskForm isOpen={isDialogOpen} setIsOpen={setDialogOpen} updateData={updateData} setUpdateData={setUpdateData} parentId={parentId} />
				)}
			</SheetContent>
		</Sheet>
	);
};

export default Items;
