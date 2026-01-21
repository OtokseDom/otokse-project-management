"use client";
import { ArrowUpDown, Edit, ListTodo, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { format } from "date-fns";
import { statusColors, priorityColors } from "@/utils/taskHelpers";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { Link } from "react-router-dom";
import DeleteDialog from "./deleteDialog";
export const columnsProject = ({ setIsOpen, setUpdateData, dialogOpen, setDialogOpen, checkHasRelation, hasRelation, selectedProjectId }) => {
	const { setSelectedProject, projects } = useProjectsStore();
	const { user } = useAuthContext(); // Get authenticated user details

	const handleUpdateProject = (project) => {
		setTimeout(() => {
			setIsOpen(true);
			setUpdateData(project);
		}, 100);
	};
	// TODO: view tasks button in actions column
	const baseColumns = useMemo(
		() => [
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
			},
			{
				id: "description",
				accessorKey: "description",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Description <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
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
					const status = row.original.status;

					return (
						<div className=" min-w-24">
							<span className={`px-2 py-1 w-full text-center rounded-2xl text-xs ${statusColors[status?.color?.toLowerCase()] || ""}`}>
								{status?.name}
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
				id: "remarks",
				accessorKey: "remarks",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Remarks <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
		],
		[projects],
	);
	// Add actions column for Superadmin
	const columnsWithActions = useMemo(() => {
		if (user?.data?.role === "Superadmin" || user?.data?.role === "Admin" || user?.data?.role === "Manager") {
			return [
				...baseColumns,
				{
					id: "actions",
					cell: ({ row }) => {
						const project = row.original;
						return (
							<div className="flex justify-center items-center">
								<Button
									variant="ghost"
									title="Update task"
									className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
									onClick={(e) => {
										e.stopPropagation();
										handleUpdateProject(project);
									}}
								>
									<Edit size={16} />
								</Button>
								<Button variant="ghost" title="View tasks" className="h-8 w-8 p-0 cursor-pointer pointer-events-auto">
									<Link
										to="/tasks"
										onClick={(e) => {
											e.stopPropagation();
											setSelectedProject(project);
										}}
									>
										<ListTodo size={20} />
									</Link>
								</Button>
								<Button
									variant="ghost"
									title="Delete task"
									className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
									onClick={(e) => {
										e.stopPropagation();
										checkHasRelation(project);
									}}
								>
									<Trash2Icon className="text-destructive" />
								</Button>
							</div>
						);
					},
				},
			];
		}
		return baseColumns;
	}, [baseColumns, user?.data?.role]);

	return {
		columnsProject: columnsWithActions,
		dialog: <DeleteDialog dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} hasRelation={hasRelation} selectedProjectId={selectedProjectId} />,
	};
};
