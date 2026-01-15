"use client";
import {
	ArrowUpDown,
	Copy,
	CornerDownRight,
	Edit,
	Eye,
	FileCheck,
	FileQuestionIcon,
	FolderKanbanIcon,
	MessageSquareMore,
	Paperclip,
	Text,
	Trash2Icon,
	UserCheck2,
	BellRing,
	CalendarCheck,
	CalendarClock,
	CalendarCheck2,
} from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { priorityColors, statusColors } from "@/utils/taskHelpers";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { Checkbox } from "@/components/ui/checkbox";
import UpdateDialog from "../updateDialog";
import DeleteDialog from "../deleteDialog";
import { useTaskDiscussionsStore } from "@/store/taskDiscussions/taskDiscussionsStore";

export const columnsTask = ({ dialogOpen, setDialogOpen, setIsOpen, setUpdateData }) => {
	const { tasks, taskHistory, setSelectedTaskHistory, setRelations } = useTasksStore();
	const { taskDiscussions } = useTaskDiscussionsStore();
	const [selectedTasks, setSelectedTasks] = useState([]);
	const [bulkAction, setBulkAction] = useState(null);

	const openDialog = (tasksToDelete = []) => {
		setSelectedTasks(tasksToDelete);
		setDialogOpen(true);
	};

	const handleUpdate = (task) => {
		setTimeout(() => {
			setIsOpen(true);
			setUpdateData(task);
		}, 100);
		const filteredHistory = taskHistory.filter((th) => th.task_id === task.id);
		setSelectedTaskHistory(filteredHistory);
		if (!task.parent_id) {
			setRelations(task);
		} else {
			const parentTask = tasks.find((t) => t.id == task.parent_id);
			setRelations(parentTask);
		}
	};
	const baseColumns = useMemo(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
				enableSorting: false,
				enableHiding: false,
			},
			{
				id: "id",
				accessorKey: "id",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							ID <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				cell: ({ row }) => {
					const { id } = row.original;
					return <span className="text-xs text-gray-500">{id}</span>;
				},
			},
			{
				id: "title",
				accessorKey: "title",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Title <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				cell: ({ row }) => {
					const { id, title, description, attachments, depth } = row.original;
					return (
						<div className="flex flex-row min-w-52 gap-2" style={{ paddingLeft: depth * 20 }}>
							<span className="text-primary">{depth == 1 ? <CornerDownRight size={20} /> : ""}</span>
							<div>
								{depth != 1 ? <span className="font-bold">{title}</span> : title}
								<br />
								<span className="flex gap-2">
									{description && <Text className="text-sm text-gray-500" size={14} />}
									{attachments && attachments.length > 0 && <Paperclip className="text-sm text-gray-500" size={14} />}
									{taskDiscussions?.filter((d) => d.task_id === id).length > 0 && (
										<MessageSquareMore className="text-sm text-gray-500" size={14} />
									)}
								</span>
								{/* <span className="text-sm text-gray-500">{description}</span> */}
							</div>
						</div>
					);
				},
			},
			{
				id: "status",
				accessorKey: "status.name",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Status <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				cell: ({ row }) => {
					const { status, depth } = row.original;

					return (
						<div className="flex flex-row min-w-24">
							{/* <span className={`px-2 py-1 text-center whitespace-nowrap rounded-2xl text-xs ${statusColors[status] || "bg-gray-200 text-gray-800"}`}> */}
							<span className={`px-2 py-1 text-center whitespace-nowrap rounded-2xl text-xs ${statusColors[status?.color?.toLowerCase()] || ""}`}>
								{status?.name || "-"}
							</span>
						</div>
					);
				},
			},
			{
				id: "priority",
				accessorKey: "priority",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Priority <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				cell: ({ row }) => {
					const priority = row.original.priority;

					return (
						<div className=" min-w-24">
							{priority ? (
								<span className={`px-2 py-1 w-full text-center rounded text-xs ${priorityColors[priority] || "bg-gray-200 text-gray-800"}`}>
									{priority?.replace("_", " ")}
								</span>
							) : (
								"-"
							)}
						</div>
					);
				},
			},
			{
				id: "project",
				accessorKey: "project.title",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Project <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				cell: ({ row }) => {
					const { project } = row.original;
					return project?.title;
				},
			},
			{
				id: "assignees",
				header: ({ column }) => (
					<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
						Assignees <ArrowUpDown className="ml-2 h-4 w-4" />
					</button>
				),
				cell: ({ row }) => {
					const assignees = row.original.assignees; // array of users

					if (!assignees || assignees.length === 0) {
						return <span className="text-gray-500">Unassigned</span>;
					}
					const names = assignees.map((user) => user.name).join(", ");
					return (
						<div>
							<span>{names}</span>
						</div>
					);
				},
			},
			{
				id: "category",
				accessorKey: "category.name",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Category <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				cell: ({ row }) => {
					const { category } = row.original;
					return category?.name;
				},
			},
			// {
			// 	id: "expected output",
			// 	accessorKey: "expected_output",
			// 	meta: { hidden: true },
			// 	header: ({ column }) => {
			// 		return (
			// 			<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
			// 				Expected Output <ArrowUpDown className="ml-2 h-4 w-4" />
			// 			</button>
			// 		);
			// 	},
			// },
			{
				id: "start date",
				accessorKey: "start_date",
				header: ({ column }) => (
					<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
						Start Date <ArrowUpDown className="ml-2 h-4 w-4" />
					</button>
				),
				// Keep raw value for sorting
				accessorFn: (row) => row.start_date,
				// Use cell renderer to format for display
				cell: ({ row }) => {
					const date = row.original.start_date;
					return date ? format(new Date(date), "MMM-dd yyyy") : "";
				},
			},
			{
				id: "end date",
				accessorKey: "end_date",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							End Date <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				// Keep raw value for sorting
				accessorFn: (row) => row.end_date,
				// Use cell renderer to format for display
				cell: ({ row }) => {
					const date = row.original.end_date;
					return date ? format(new Date(date), "MMM-dd yyyy") : "";
				},
			},
			{
				id: "actual date",
				accessorKey: "actual_date",
				header: ({ column }) => (
					<button className="flex items-center" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
						Actual Date <ArrowUpDown className="ml-2 h-4 w-4" />
					</button>
				),
				// keep raw value for sorting
				accessorFn: (row) => row.actual_date,
				// display formatted
				cell: ({ row }) => {
					const { actual_date, days_estimate, days_taken, delay_days } = row.original;

					const hasEstimate = days_estimate !== null && days_estimate !== undefined && days_estimate !== 0;
					const hasTaken = days_taken !== null && days_taken !== undefined && days_taken !== 0;
					const hasDelay = delay_days !== null && delay_days !== undefined && delay_days !== 0;

					return (
						<div>
							{/* Date */}
							{actual_date ? format(new Date(actual_date), "MMM-dd yyyy") : "-"}
							<br />

							{/* Estimate */}
							{hasEstimate && (
								<>
									<span className="text-xs text-muted-foreground">
										<span className="font-semibold">Estimate:</span> {days_estimate}
									</span>
									<br />
								</>
							)}

							{/* Taken */}
							{hasTaken && (
								<>
									<span className="text-xs text-muted-foreground">
										<span className="font-semibold">Taken:</span> {days_taken}
									</span>
									<br />
								</>
							)}

							{/* Delay */}
							{hasDelay && (
								<>
									<span className="text-xs text-muted-foreground">
										<span className="font-semibold">Delay:</span> {delay_days}
									</span>
									<br />
								</>
							)}
						</div>
					);
				},
			},
			{
				id: "start time",
				accessorKey: "start_time",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Start Time <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				accessorFn: (row) => (row.start_time ? format(new Date(`1970-01-01T${row.start_time}`), "h:mm a") : ""),
			},
			{
				id: "end time",
				accessorKey: "end_time",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							End Time <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				accessorFn: (row) => (row.end_time ? format(new Date(`1970-01-01T${row.end_time}`), "h:mm a") : ""),
			},
			{
				id: "actual time",
				accessorKey: "actual_time",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Actual Time <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				// Keep raw value for sorting
				accessorFn: (row) => row.actual_time,
				// Use cell renderer to format for display
				cell: ({ row }) => {
					const { actual_time, time_estimate, time_taken, delay } = row.original;
					const timeEstimate = row.original.time_estimate;
					if (typeof timeEstimate !== "number" || isNaN(timeEstimate)) return "";
					const hrs = Math.floor(timeEstimate);
					const mins = Math.round((timeEstimate - hrs) * 60);
					const timeEstimateFormatted = `${hrs} hr${hrs !== 1 ? "s" : ""}${mins ? ` ${mins} min${mins !== 1 ? "s" : ""}` : ""}`;
					return (
						<div>
							{actual_time ? format(new Date(`1970-01-01T${actual_time}`), "h:mm a") : "-"}
							<br />
							{time_estimate && (
								<>
									<span className="text-xs text-muted-foreground">
										<span className="font-semibold">Estimate:</span> {`${timeEstimateFormatted}`}
									</span>
									<br />
								</>
							)}
							{time_taken && (
								<>
									<span className="text-xs text-muted-foreground">
										<span className="font-semibold">Taken:</span> {`${time_taken}`}
									</span>
									<br />
								</>
							)}
							{delay && (
								<>
									<span className="text-xs text-muted-foreground">
										<span className="font-semibold">Delay:</span> {`${delay}`}
									</span>
									<br />
								</>
							)}
						</div>
					);
				},
			},
			{
				id: "delay reason",
				accessorKey: "delay_reason",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Delay Reason <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
			{
				id: "performance rating",
				accessorKey: "performance_rating",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Performance Rating <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
			{
				id: "remarks",
				accessorKey: "remarks",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Remarks <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
				cell: ({ row }) => {
					const remarks = row.original.remarks;
					return <div className="min-w-52">{remarks}</div>;
				},
			},
			{
				id: "actions",
				cell: ({ row, table }) => {
					const task = row.original;
					const selectedCount = table.getSelectedRowModel().rows.length;
					return (
						<div className="flex justify-center items-center">
							<Button
								variant="ghost"
								title="Update task"
								className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
								onClick={(e) => {
									e.stopPropagation();
									handleUpdate(task);
								}}
							>
								<Edit size={16} />
							</Button>
							<Button
								variant="ghost"
								title="Clone task"
								className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
								onClick={(e) => {
									e.stopPropagation();
									const clonedTask = {
										...task,
										id: undefined,
										title: task.title + " (Clone)",
										calendar_add: true,
									};
									setUpdateData(clonedTask);
									setIsOpen(true);
								}}
							>
								<Copy size={16} />
							</Button>
							<DropdownMenu modal={false}>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
										<span className="sr-only">Open menu</span>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{table.getFilteredSelectedRowModel().rows.length === 0 && (
										<>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													let selected = table.getSelectedRowModel().rows.map((r) => r.original);
													if (selected.length === 0) selected = [row.original];

													setSelectedTasks(selected);
													setBulkAction("status");
												}}
											>
												<FileCheck /> Update Status
											</DropdownMenuItem>

											<DropdownMenuItem
												className="cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													let selected = table.getSelectedRowModel().rows.map((r) => r.original);
													if (selected.length === 0) selected = [row.original];

													setSelectedTasks(selected);
													setBulkAction("assignees");
												}}
											>
												<UserCheck2 /> Update Assignees
											</DropdownMenuItem>

											<DropdownMenuItem
												className="cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													let selected = table.getSelectedRowModel().rows.map((r) => r.original);
													if (selected.length === 0) selected = [row.original];

													setSelectedTasks(selected);
													setBulkAction("project");
												}}
											>
												<FolderKanbanIcon /> Update Project
											</DropdownMenuItem>

											<DropdownMenuItem
												className="cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													let selected = table.getSelectedRowModel().rows.map((r) => r.original);
													if (selected.length === 0) selected = [row.original];

													setSelectedTasks(selected);
													setBulkAction("category");
												}}
											>
												<FileQuestionIcon /> Update Category
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													let selected = table.getSelectedRowModel().rows.map((r) => r.original);
													if (selected.length === 0) selected = [row.original];
													setSelectedTasks(selected);
													setBulkAction("priority");
												}}
											>
												<BellRing /> Update Priority
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													let selected = table.getSelectedRowModel().rows.map((r) => r.original);
													if (selected.length === 0) selected = [row.original];
													setSelectedTasks(selected);
													setBulkAction("start_date");
												}}
											>
												<CalendarCheck /> Update Start Date
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													let selected = table.getSelectedRowModel().rows.map((r) => r.original);
													if (selected.length === 0) selected = [row.original];
													setSelectedTasks(selected);
													setBulkAction("end_date");
												}}
											>
												<CalendarClock /> Update End Date
											</DropdownMenuItem>
											<DropdownMenuItem
												className="cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													let selected = table.getSelectedRowModel().rows.map((r) => r.original);
													if (selected.length === 0) selected = [row.original];
													setSelectedTasks(selected);
													setBulkAction("actual_date");
												}}
											>
												<CalendarCheck2 /> Update Actual Date
											</DropdownMenuItem>
										</>
									)}
									<hr />
									<DropdownMenuItem
										className="w-full text-left cursor-pointer"
										onClick={(e) => {
											e.stopPropagation();
											const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
											if (selectedRows.length > 0) {
												openDialog(selectedRows);
											} else {
												openDialog([task]);
											}
										}}
									>
										<Trash2Icon className="text-destructive" /> Delete Task
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[tasks]
	);

	// Return columns and dialog as an object (consumer should use columns and render dialog outside table)
	return {
		columnsTask: baseColumns,
		dialog: <DeleteDialog dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} selectedTasks={selectedTasks} />,
		bulkDialog: <UpdateDialog open={!!bulkAction} onClose={() => setBulkAction(null)} action={bulkAction} selectedTasks={selectedTasks} />,
	};
};
