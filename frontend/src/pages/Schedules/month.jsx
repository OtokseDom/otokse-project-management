"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import TaskForm from "../Tasks/form";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import History from "@/components/task/History";
import { flattenTasks, statusColors } from "@/utils/taskHelpers";
import Relations from "@/components/task/Relations";
import Tabs from "@/components/task/Tabs";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { TaskDiscussions } from "@/components/task/Discussion";

export default function Month({ days, currentMonth, getTaskForDate }) {
	const { loading } = useLoadContext();
	const { tasks, taskHistory, selectedTaskHistory, setSelectedTaskHistory, setRelations, activeTab, setActiveTab, selectedUser } = useTasksStore();

	// const [tasks, setTasks] = useState(tasks);
	const [openDialogIndex, setOpenDialogIndex] = useState(null);
	const [updateData, setUpdateData] = useState({});
	const [parentId, setParentId] = useState(null); //for adding subtasks from relations tab

	useEffect(() => {
		if (!openDialogIndex) {
			setRelations({});
			setActiveTab("update");
			setParentId(null);
		}
		if (openDialogIndex !== null && !updateData.id) {
			setUpdateData({
				calendar_add: true,
				assignee: selectedUser.id !== "undefined" ? selectedUser : null,
				assignee_id: selectedUser.id !== "undefined" ? selectedUser.id : null,
				start_date: format(days[openDialogIndex], "yyyy-MM-dd"),
				end_date: format(days[openDialogIndex], "yyyy-MM-dd"),
			});
		}
	}, [openDialogIndex]);
	return (
		<div className="grid grid-cols-7 gap-0 md:gap-1">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
					openDialogIndex !== null ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
				}`}
				aria-hidden="true"
				onClick={(e) => {
					e.stopPropagation();
					e.preventDefault();
					setOpenDialogIndex(null);
				}}
			/>
			{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
				<div key={day} className="p-2 font-semibold text-center text-foreground">
					{day}
				</div>
			))}
			{days.map((day, index) => {
				const isCurrentMonth = day.getMonth() === currentMonth;
				const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
				const dayTasks = getTaskForDate(day, tasks);

				const isDialogOpen = openDialogIndex === index; //added to prevent aria-hidden warning
				return (
					<Sheet key={index} open={isDialogOpen} onOpenChange={(open) => setOpenDialogIndex(open ? index : null)} modal={false}>
						<SheetTrigger
							asChild
							onClick={() => {
								setOpenDialogIndex(index);
							}}
						>
							<div>
								{/* Calendar cell Clickable */}
								<div
									key={index}
									className={`
										min-h-24 p-1 border transition-colors duration-200 cursor-pointer rounded-sm
										${isCurrentMonth ? "bg-white" : "bg-sidebar text-gray-400"} 
										${isToday ? "bg-blue-50 border-blue-200" : "border-gray-500"}
									`}
								>
									<div className="flex justify-between items-center">
										<span className={`text-sm font-medium ${isToday ? "text-blue-600" : ""}`}>{day.getDate()}</span>
										{loading ? (
											<div className="flex flex-col w-full">
												<Skeleton index={index * 0.5} className="h-4 w-full bg-sidebar-border" />
											</div>
										) : (
											dayTasks?.length > 0 && (
												<span className="text-xs bg-muted-foreground text-background rounded-full px-1">{dayTasks?.length}</span>
											)
										)}
									</div>
									{loading ? (
										<div className="flex flex-col w-full">
											<Skeleton index={index * 0.5} className="h-4 mt-1 w-full bg-sidebar-border" />
											<Skeleton index={index * 0.5} className="h-4 mt-1 w-full bg-sidebar-border" />
											<Skeleton index={index * 0.5} className="h-4 mt-1 w-full bg-sidebar-border" />
										</div>
									) : (
										<div className="mt-1 space-y-1 overflow-y-auto max-h-20">
											{(dayTasks || []).map((task) => (
												<div
													title={task.title}
													key={task.id}
													onClick={(e) => {
														//set update tasks when a task is clicked
														e.stopPropagation();
														setUpdateData(task);
														setOpenDialogIndex(index);
														const filteredHistory = taskHistory.filter((th) => th.task_id === task.id);
														setSelectedTaskHistory(filteredHistory);
														if (!task.parent_id) {
															setRelations(task);
														} else {
															const filteredRelations = tasks.filter((t) => t.id == task.parent_id);
															setRelations(...filteredRelations);
														}
													}}
													className={`
											text-xxs md:text-xs py-1 md:p-1 rounded border truncate
											${statusColors[task?.status?.color] || "bg-secondary border-foreground/50 text-foreground"}
										`}
												>
													<div className="flex items-center">
														<span>{task.title}</span>
													</div>
												</div>
											))}
											{/* {dayTasks?.length > 3 && <div className="text-xs text-blue-600">+{dayTasks?.length - 3} more</div>} */}
										</div>
									)}
								</div>
							</div>
						</SheetTrigger>
						<SheetContent side="right" className="overflow-y-auto w-full sm:w-[640px]">
							<SheetHeader>
								<SheetTitle>
									<Tabs loading={loading} updateData={updateData} activeTab={activeTab} setActiveTab={setActiveTab} parentId={parentId} />
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
								<TaskForm
									isOpen={isDialogOpen}
									setIsOpen={(open) => setOpenDialogIndex(open ? index : null)}
									updateData={updateData}
									setUpdateData={setUpdateData}
									parentId={parentId}
								/>
							)}
						</SheetContent>
					</Sheet>
				);
			})}
		</div>
	);
}
