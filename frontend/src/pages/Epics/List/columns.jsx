"use client";
import { ArrowUpDown, Edit, ListTodo, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { format } from "date-fns";
import { statusColors, priorityColors } from "@/utils/taskHelpers";
import { useEpicsStore } from "@/store/epics/epicsStore";
import { Link } from "react-router-dom";
import DeleteDialog from "./deleteDialog";
import { useEpicStore } from "@/store/epic/epicStore";
import { useEpicHelpers } from "@/utils/epicHelpers";

export const columnsEpic = () => {
	const { setSelectedEpic, epics } = useEpicsStore();
	const { user } = useAuthContext(); // Get authenticated user details
	const { setIsOpen, setUpdateData, dialogOpen, setDialogOpen, hasRelation, selectedEpicId } = useEpicStore();
	const { checkHasRelation } = useEpicHelpers();

	const handleUpdateEpic = (epic) => {
		setTimeout(() => {
			setIsOpen(true);
			setUpdateData(epic);
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
				id: "slug",
				accessorKey: "slug",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Slug <ArrowUpDown className="ml-2 h-4 w-4" />
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
				id: "owner",
				accessorKey: "owner.name",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Owner <ArrowUpDown className="ml-2 h-4 w-4" />
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
		[epics]
	);
	// Add actions column for Superadmin
	const columnsWithActions = useMemo(() => {
		if (user?.data?.role === "Superadmin" || user?.data?.role === "Admin" || user?.data?.role === "Manager") {
			return [
				...baseColumns,
				{
					id: "actions",
					cell: ({ row }) => {
						const epic = row.original;
						return (
							<div className="flex justify-center items-center">
								<Button
									variant="ghost"
									title="Update task"
									className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
									onClick={(e) => {
										e.stopPropagation();
										handleUpdateEpic(epic);
									}}
								>
									<Edit size={16} />
								</Button>
								<Button variant="ghost" title="View projects" className="h-8 w-8 p-0 cursor-pointer pointer-events-auto">
									<Link
										to="/projects"
										onClick={(e) => {
											e.stopPropagation();
											setSelectedEpic(epic.id);
										}}
									>
										<ListTodo size={20} />
									</Link>
								</Button>
								<Button
									variant="ghost"
									title="Delete epic"
									className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
									onClick={(e) => {
										e.stopPropagation();
										checkHasRelation(epic);
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
		columnsEpic: columnsWithActions,
		dialog: <DeleteDialog dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} hasRelation={hasRelation} selectedEpicId={selectedEpicId} />,
	};
};
