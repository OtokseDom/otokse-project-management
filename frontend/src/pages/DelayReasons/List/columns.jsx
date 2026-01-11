"use client";
import { ArrowUpDown, Edit, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { useToast } from "@/contexts/ToastContextProvider";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useDelayReasonsStore } from "@/store/delayReasons/delayReasonsStore";

export const columnsDelayReason = ({ setIsOpen, setUpdateData, dialogOpen, setDialogOpen }) => {
	const { delayReasons, removeDelayReason, delayReasonsLoading, setDelayReasonsLoading } = useDelayReasonsStore();
	const showToast = useToast();
	const { user } = useAuthContext(); // Get authenticated user details
	const [selectedDelayReasonId, setSelectedDelayReasonId] = useState(null);
	const [hasRelation, setHasRelation] = useState(false);

	const openDialog = async (delayReason = {}) => {
		setDelayReasonsLoading(true);
		setDialogOpen(true);
		setSelectedDelayReasonId(delayReason.id);
		try {
			const hasRelationResponse = await axiosClient.post(API().relation_check("reason", delayReason.id));
			setHasRelation(hasRelationResponse?.data?.data?.exists);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setDelayReasonsLoading(false);
		}
	};
	useEffect(() => {
		if (!dialogOpen) setHasRelation(false);
	}, [dialogOpen]);
	const handleUpdateDelayReason = (delayReason) => {
		setIsOpen(true);
		setUpdateData(delayReason);
	};
	const handleDelete = async (id) => {
		setDelayReasonsLoading(true);
		try {
			await axiosClient.delete(API().delay_reason(id));
			removeDelayReason(id);
			// setDelayReasons(delayReasonResponse.data.data);
			showToast("Success!", "Delay reason deleted.", 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			// Always stop loading when done
			setDialogOpen(false);
			setDelayReasonsLoading(false);
		}
	};
	const baseColumns = useMemo(
		() => [
			{
				id: "name",
				accessorKey: "name",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Name <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
			{
				id: "code",
				accessorKey: "code",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Code <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
			{
				id: "category",
				accessorKey: "category",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Category <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
			{
				id: "impact_level",
				accessorKey: "impact_level",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Impact Level <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
			{
				id: "severity",
				accessorKey: "severity",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Severity <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
			{
				id: "is_valid",
				accessorKey: "is_valid",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Validity <ArrowUpDown className="ml-2 h-4 w-4" />
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
				id: "is_active",
				accessorKey: "is_active",
				header: ({ column }) => {
					return (
						<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
							Status <ArrowUpDown className="ml-2 h-4 w-4" />
						</button>
					);
				},
			},
		],
		[delayReasons]
	);
	// Add actions column for Superadmin
	if (user?.data?.role === "Superadmin" || user?.data?.role === "Admin" || user?.data?.role === "Manager") {
		baseColumns.push({
			id: "actions",
			cell: ({ row }) => {
				const delayReason = row.original;
				return (
					<div className="flex justify-center items-center">
						<Button
							variant="ghost"
							title="Update task"
							className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
							onClick={(e) => {
								e.stopPropagation();
								handleUpdateDelayReason(delayReason);
							}}
						>
							<Edit size={16} />
						</Button>
						<Button
							variant="ghost"
							title="Delete task"
							className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
							onClick={(e) => {
								e.stopPropagation();
								openDialog(delayReason);
							}}
						>
							<Trash2Icon className="text-destructive" />
						</Button>
					</div>
				);
			},
		});
	}

	const dialog = (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={false}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{hasRelation ? <span className="text-yellow-800">Warning</span> : "Are you absolutely sure?"}</DialogTitle>
					<DialogDescription>{!hasRelation && "This action cannot be undone."}</DialogDescription>
				</DialogHeader>
				<div className="ml-4 text-base">
					{hasRelation && (
						<>
							<span className="text-yellow-800">Delay reason cannot be deleted because it has assigned tasks.</span>
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
							disabled={delayReasonsLoading}
							onClick={() => {
								handleDelete(selectedDelayReasonId);
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
	return { columnsDelayReason: baseColumns, dialog };
};
