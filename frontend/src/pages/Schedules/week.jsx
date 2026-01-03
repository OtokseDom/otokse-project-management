"use client";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import TaskForm from "../Tasks/form";
import { Skeleton } from "@/components/ui/skeleton";
import History from "@/components/task/History";
import { statusColors } from "@/utils/taskHelpers";
import Relations from "@/components/task/Relations";
import Tabs from "@/components/task/Tabs";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { TaskDiscussions } from "@/components/task/Discussion";

export default function Week({ weekstart_date }) {
	const { tasks, taskHistory, selectedTaskHistory, setSelectedTaskHistory, setRelations, activeTab, setActiveTab, selectedUser, tasksLoading } =
		useTasksStore();

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
			const day = weekDays[openDialogIndex];
			setUpdateData({
				calendar_add: true,
				assignee: selectedUser.id !== "undefined" ? selectedUser : null,
				assignee_id: selectedUser.id !== "undefined" ? selectedUser.id : null,
				start_date: format(day, "yyyy-MM-dd"),
				end_date: format(day, "yyyy-MM-dd"),
			});
		}
	}, [openDialogIndex]);

	// Get all days for the week view
	const getWeekDays = (start_date) => {
		const days = [];
		const currentDate = new Date(start_date);

		for (let i = 0; i < 7; i++) {
			days.push(new Date(currentDate));
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return days;
	};

	// Generate time slots for week view
	const getTimeSlots = () => {
		const slots = [];
		for (let hour = 7; hour <= 19; hour++) {
			slots.push(`${hour.toString().padStart(2, "0")}:00`);
		}
		return slots;
	};

	// Check if a task is within a time slot
	const isInTimeSlot = (task, time, date) => {
		const formattedDate = format(date, "yyyy-MM-dd");
		const [slotHour] = time?.split(":").map(Number);
		const [startHour] = task.start_time ? task.start_time.split(":").map(Number) : [];
		const [endHour, endMinutes] = task.end_time ? task.end_time.split(":").map(Number) : [];
		const taskStartDate = format(new Date(task?.start_date), "yyyy-MM-dd");
		const taskEndDate = format(new Date(task?.end_date), "yyyy-MM-dd");

		return (
			Array.isArray(task.assignees) &&
			task.assignees.some((assignee) => assignee.id === selectedUser?.id) &&
			formattedDate >= taskStartDate &&
			formattedDate <= taskEndDate &&
			startHour <= slotHour &&
			(endHour > slotHour || (endHour === slotHour && endMinutes > 0))
		);
	};

	const weekDays = getWeekDays(weekstart_date);
	const timeSlots = getTimeSlots();

	return (
		<div className="overflow-x-auto">
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
			<div className="min-w-max grid grid-cols-8 gap-1">
				{/* Time column */}
				<div className="col-span-1">
					<div className="h-12 p-2"></div> {/* Empty header cell */}
					{timeSlots.map((time) => {
						const [hour, minute] = time.split(":").map(Number);
						const date = new Date();
						date.setHours(hour, minute, 0, 0);
						return (
							<div key={time} className="h-16 p-2 text-xs text-right pr-2 text-gray-500">
								{format(date, "hh:mm a")}
							</div>
						);
					})}
				</div>

				{/* Days columns */}
				{weekDays.map((day, index) => {
					const formattedDate = format(day, "yyyy-MM-dd");
					const isToday = formattedDate === format(new Date(), "yyyy-MM-dd");
					const isDialogOpen = openDialogIndex === index; //added to prevent aria-hidden warning

					return (
						<Sheet key={index} open={isDialogOpen} onOpenChange={(open) => setOpenDialogIndex(open ? index : null)} modal={false}>
							<SheetTrigger asChild>
								<div
									className="col-span-1 min-w-32 text-left cursor-pointer"
									onClick={() => {
										setOpenDialogIndex(index);
									}}
								>
									<div className={`h-12 p-2 text-center font-medium ${isToday ? "text-blue-600" : ""}`}>
										<div>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getDay()]}</div>
										<div className="text-sm">{day.getDate()}</div>
									</div>

									{timeSlots.map((time, timeIndex) => {
										const tasksInSlot = (Array.isArray(tasks) ? tasks : []).filter((s) => isInTimeSlot(s, time, day));
										return (
											<div
												key={`${index}-${timeIndex}`}
												className={`
                                                h-16 p-1 border-t   relative
                                                ${isToday ? "bg-blue-50" : "bg-sidebar"} 
                                                ${timeIndex === timeSlots.length - 1 ? "border-b" : ""}
                                                ${index === 6 ? "border-r" : ""}
                                            `}
											>
												{tasksLoading ? (
													<div className="flex flex-col w-full">
														<div className="flex flex-row items-center gap-2">
															<Skeleton index={timeIndex * 0.5} className="h-3 mt-1 w-1/3 bg-sidebar-border" />
															<Skeleton index={timeIndex * 0.5} className="h-3 mt-1 w-2/3 bg-sidebar-border" />
														</div>
														<Skeleton index={timeIndex * 0.5} className="h-3 mt-1 w-full bg-sidebar-border" />
														<Skeleton index={timeIndex * 0.5} className="h-3 mt-1 w-full bg-sidebar-border" />
													</div>
												) : (
													""
												)}
												{tasksInSlot.map((task) => {
													// Calculate position and height based on time
													const [startHour, startMin] = task.start_time?.split(":").map(Number);
													const formattedStartTime = new Date();
													formattedStartTime.setHours(startHour, startMin, 0, 0);

													const [endHour, endMin] = task.end_time?.split(":").map(Number);
													const formattedEndTime = new Date();
													formattedEndTime.setHours(endHour, endMin, 0, 0);
													const [slotHour] = time.split(":").map(Number);
													// Only show if this is the starting slot for this task
													if (startHour !== slotHour) return null;

													// Calculate duration in hours
													const duration = endHour - startHour + (endMin - startMin) / 60;
													return (
														<div
															title={task.title}
															key={task.id}
															onClick={() => {
																//set update data when a task is clicked
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
														absolute left-0 right-0 mx-1 p-1 rounded border z-10 overflow-clip
														${statusColors[task?.status?.color] || "bg-secondary border-foreground/50 text-foreground"}
														`}
															style={{ height: `${duration * 4}rem`, top: `${(startMin / 60) * 4}rem` }}
														>
															<div className="text-xs flex items-center gap-1 truncate">
																{format(formattedStartTime, "hh:mm a")} - {format(formattedEndTime, "hh:mm a")}
															</div>
															<div className={`text-xs mt-2`}>
																<b>Title:</b> {task.title}
															</div>
															<div className="text-xs mt-2 font-medium">
																<b>Description:</b> {task.description}
															</div>
														</div>
													);
												})}
											</div>
										);
									})}
								</div>
							</SheetTrigger>
							<SheetContent side="right" className="overflow-y-auto w-full sm:w-[640px]">
								<SheetHeader>
									<SheetTitle>
										<Tabs
											loading={tasksLoading}
											updateData={updateData}
											activeTab={activeTab}
											setActiveTab={setActiveTab}
											parentId={parentId}
										/>
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
		</div>
	);
}
