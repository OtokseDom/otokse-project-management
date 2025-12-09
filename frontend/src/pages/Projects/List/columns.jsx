"use client";
import { ArrowUpDown, Edit, ListTodo, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { format } from "date-fns";
import { useToast } from "@/contexts/ToastContextProvider";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { statusColors, priorityColors } from "@/utils/taskHelpers";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { Link } from "react-router-dom";
export const columnsProject = ({ handleDelete, setIsOpen, setUpdateData, dialogOpen, setDialogOpen }) => {
	const { setSelectedProject, projects, projectsLoading, setProjectsLoading } = useProjectsStore();
	const showToast = useToast();
	const { user } = useAuthContext(); // Get authenticated user details
	const [selectedProjectId, setSelectedProjectId] = useState(null);
	const [hasRelation, setHasRelation] = useState(false);

	const openDialog = async (project = {}) => {
		setProjectsLoading(true);
		setTimeout(() => {
			setDialogOpen(true);
		}, 100);
		setSelectedProjectId(project.id);
		try {
			const hasRelationResponse = await axiosClient.post(API().relation_check("project", project.id));
			setHasRelation(hasRelationResponse?.data?.data?.exists);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setProjectsLoading(false);
		}
	};
	useEffect(() => {
		if (!dialogOpen) setHasRelation(false);
	}, [dialogOpen]);

	const handleUpdateProject = (project) => {
		setTimeout(() => {
			setIsOpen(true);
			setUpdateData(project);
		}, 100);
	};

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
			// {
			// 	id: "target_date",
			// 	accessorKey: "target_date",
			// 	header: ({ column }) => (
			// 		<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
			// 			Target Date <ArrowUpDown className="ml-2 h-4 w-4" />
			// 		</button>
			// 	),
			// 	// Keep raw value for sorting
			// 	accessorFn: (row) => row.target_date,
			// 	// Use cell renderer to format for display
			// 	cell: ({ row }) => {
			// 		const date = row.original.target_date;
			// 		return date ? format(new Date(date), "MMM-dd yyyy") : "";
			// 	},
			// },
			// {
			// 	id: "estimated_date",
			// 	accessorKey: "estimated_date",
			// 	header: ({ column }) => (
			// 		<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
			// 			Estimated Date <ArrowUpDown className="ml-2 h-4 w-4" />
			// 		</button>
			// 	),
			// 	// Keep raw value for sorting
			// 	accessorFn: (row) => row.estimated_date,
			// 	// Use cell renderer to format for display
			// 	cell: ({ row }) => {
			// 		const date = row.original.estimated_date;
			// 		return date ? format(new Date(date), "MMM-dd yyyy") : "";
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
		[projects]
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
							<div className="flex items-center justify-center gap-2">
								<Button
									size="icon"
									variant="ghost"
									onClick={(e) => {
										e.stopPropagation();
										handleUpdateProject(project);
									}}
								>
									<Edit />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									onClick={(e) => {
										e.stopPropagation();
										setSelectedProject(project);
									}}
								>
									<ListTodo />
								</Button>
								<Button
									size="icon"
									variant="ghost"
									onClick={(e) => {
										e.stopPropagation();
										openDialog(project);
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

	const dialog = (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={true}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{hasRelation ? <span className="text-yellow-800">Warning</span> : "Are you absolutely sure?"}</DialogTitle>
					<DialogDescription>{!hasRelation && "This action cannot be undone."}</DialogDescription>
				</DialogHeader>
				<div className="ml-4 text-base">
					{hasRelation && (
						<>
							<span className="text-yellow-800">Project cannot be deleted because it has assigned tasks.</span>
						</>
					)}
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="secondary">
							Close
						</Button>
					</DialogClose>
					{!hasRelation && (
						<Button
							disabled={projectsLoading}
							onClick={() => {
								handleDelete(selectedProjectId);
								setDialogOpen(false);
							}}
						>
							Yes, delete
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
	// Return columns and dialog as an object (consumer should use columns and render dialog outside table)
	return { columnsProject: columnsWithActions, dialog };
};
