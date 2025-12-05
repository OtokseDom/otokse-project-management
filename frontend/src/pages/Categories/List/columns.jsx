"use client";
import { ArrowUpDown, Edit, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { useToast } from "@/contexts/ToastContextProvider";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
export const columnsCategory = ({ setIsOpen, setUpdateData, dialogOpen, setDialogOpen }) => {
	const { categories, removeCategory, categoriesLoading, setCategoriesLoading } = useCategoriesStore();
	const showToast = useToast();
	const { user } = useAuthContext(); // Get authenticated user details
	const [selectedCategoryId, setSelectedCategoryId] = useState(null);
	const [hasRelation, setHasRelation] = useState(false);

	const openDialog = async (category = {}) => {
		setCategoriesLoading(true);
		setDialogOpen(true);
		setSelectedCategoryId(category.id);
		try {
			const hasRelationResponse = await axiosClient.post(API().relation_check("category", category.id));
			setHasRelation(hasRelationResponse?.data?.data?.exists);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setCategoriesLoading(false);
		}
	};
	useEffect(() => {
		if (!dialogOpen) setHasRelation(false);
	}, [dialogOpen]);
	const handleUpdateCategory = (category) => {
		setIsOpen(true);
		setUpdateData(category);
	};
	const handleDelete = async (id) => {
		setCategoriesLoading(true);
		try {
			await axiosClient.delete(API().category(id));
			removeCategory(id);
			// setCategories(categoryResponse.data.data);
			showToast("Success!", "Category deleted.", 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			// Always stop loading when done
			setDialogOpen(false);
			setCategoriesLoading(false);
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
		],
		[categories]
	);
	// Add actions column for Superadmin
	if (user?.data?.role === "Superadmin" || user?.data?.role === "Admin" || user?.data?.role === "Manager") {
		baseColumns.push({
			id: "actions",
			cell: ({ row }) => {
				const category = row.original;
				return (
					<div className="flex justify-center items-center">
						<Button
							variant="ghost"
							title="Update task"
							className="h-8 w-8 p-0 cursor-pointer pointer-events-auto"
							onClick={(e) => {
								e.stopPropagation();
								handleUpdateCategory(category);
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
								openDialog(category);
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
							<span className="text-yellow-800">Category cannot be deleted because it has assigned tasks.</span>
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
							disabled={categoriesLoading}
							onClick={() => {
								handleDelete(selectedCategoryId);
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
	return { columnsCategory: baseColumns, dialog };
};
