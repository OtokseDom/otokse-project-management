"use client";
import { ArrowUpDown, Eye, MoreHorizontal, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useToast } from "@/contexts/ToastContextProvider";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useUsersStore } from "@/store/users/usersStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";

export const columns = ({ setIsOpen, setUpdateData }) => {
	const { users, updateUser, removeUser, setUsersLoading, usersLoading } = useUsersStore();
	const { removeUserFilter } = useDashboardStore();
	const { user } = useAuthContext();
	const showToast = useToast();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogType, setDialogType] = useState(null);
	const [selectedUser, setSelectedUser] = useState(null);
	const [hasRelation, setHasRelation] = useState(false);

	const openDialog = async (type, userData = {}) => {
		setUsersLoading(true);
		setDialogType(type);
		setDialogOpen(true);
		setSelectedUser(userData.id);
		try {
			const hasRelationResponse = await axiosClient.post(API().relation_check("assignee", userData.id));
			setHasRelation(hasRelationResponse?.data?.data?.exists);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setUsersLoading(false);
		}
	};
	useEffect(() => {
		if (!dialogOpen) setHasRelation(false);
	}, [dialogOpen]);

	const handleUpdateUser = (user, event) => {
		event.stopPropagation();
		// wait for dialog menu to close
		setTimeout(() => {
			setIsOpen(true);
			setUpdateData(user);
		}, 10);
	};

	const handleApproval = async (userRow = {}) => {
		setUsersLoading(true);
		try {
			const form = { ...userRow, status: "active" };
			const res = await axiosClient.put(API().user(userRow?.id), form);
			if (res.data.success) {
				showToast("Success!", res.data.message, 3000);
				updateUser(userRow.id, res.data.data);
			} else {
				showToast("Failed!", res.message, 3000);
			}
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
		} finally {
			setUsersLoading(false);
		}
	};
	const handleDelete = async (id) => {
		setUsersLoading(true);
		try {
			const userResponse = await axiosClient.delete(API().user(id));
			removeUser(id);
			removeUserFilter(id);
			showToast("Success!", userResponse?.data?.message, 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setUsersLoading(false);
		}
	};
	const baseColumns = useMemo(
		() => [
			{
				id: "name",
				accessorKey: "name",
				header: ({ column }) => (
					<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
						Name <ArrowUpDown className="ml-2 h-4 w-4" />
					</button>
				),
				cell: ({ row }) => {
					const { name, id, status } = row.original;
					return (
						<div className="flex items-center gap-2">
							<User2 size={60} />
							<div className="flex flex-col w-full">
								{name} {user?.id === id && <span className="text-xs text-yellow-800"> (Me)</span>}
								<span
									className={`backdrop-blur-sm px-2 py-1 text-xs w-fit rounded-full ${
										status === "pending"
											? "text-yellow-100 bg-yellow-900/50"
											: status === "active"
											? "text-green-100 bg-green-900/50"
											: status === "inactive"
											? "text-gray-100 bg-gray-700/50"
											: status === "rejected"
											? "text-red-100 bg-red-900/50"
											: status === "banned"
											? "text-purple-100 bg-purple-900/50"
											: ""
									}`}
								>
									{status}
								</span>
							</div>
						</div>
					);
				},
			},
			{ id: "role", accessorKey: "role", header: createHeader("Role") },
			{ id: "email", accessorKey: "email", header: createHeader("Email") },
			{ id: "position", accessorKey: "position", header: createHeader("Position") },
			// ...existing code...
		],
		[users]
	);

	// Add actions column for Superadmin
	if (user?.data?.role === "Superadmin" || user?.data?.role === "Admin" || user?.data?.role === "Manager") {
		baseColumns.push({
			id: "actions",
			cell: ({ row }) => {
				const userRow = row.original;
				return (
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{userRow.status === "pending" && (
								<>
									<DropdownMenuItem
										className="text-green-500 cursor-pointer"
										onClick={(e) => {
											e.stopPropagation();
											handleApproval(userRow);
										}}
									>
										Approve User
									</DropdownMenuItem>
									<DropdownMenuItem
										className="text-red-500 cursor-pointer"
										onClick={(e) => {
											e.stopPropagation();
											openDialog("reject", userRow);
										}}
									>
										Reject User
									</DropdownMenuItem>
									<hr />
								</>
							)}
							<DropdownMenuItem>
								<Link to={`/users/${userRow.id}`}>View Profile</Link>
							</DropdownMenuItem>
							<DropdownMenuItem className="cursor-pointer" onClick={(e) => handleUpdateUser(userRow, e)}>
								Update User
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									openDialog("delete", userRow);
								}}
							>
								Delete Account
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		});
	} else {
		baseColumns.push({
			id: "actions",
			cell: ({ row }) => {
				const userRow = row.original;
				return (
					<Link title="View profile" to={`/users/${userRow.id}`}>
						<Eye className="text-muted-foreground" size={16} />
					</Link>
				);
			},
		});
	}

	// Render Dialog once per table, outside cell renderer
	const dialog = (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={true}>
			<DialogContent onClick={(e) => e.stopPropagation()}>
				<DialogHeader>
					<DialogTitle>{hasRelation ? <span className="text-yellow-800">Warning</span> : "Are you absolutely sure?"}</DialogTitle>
					<DialogDescription>{!hasRelation && "This action cannot be undone."}</DialogDescription>
				</DialogHeader>
				<div className="ml-4 text-base">
					{hasRelation && (
						<>
							<span className="text-yellow-800">User cannot be deleted because it has assigned tasks.</span>
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
							disabled={usersLoading}
							onClick={() => {
								if (dialogType === "reject") handleDelete(selectedUser);
								else if (dialogType === "delete") handleDelete(selectedUser);
								setDialogOpen(false);
							}}
						>
							{dialogType === "delete" ? "Yes, delete" : "Yes, reject"}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);

	// Return columns and dialog as an object (consumer should use columns and render dialog outside table)
	return { columns: baseColumns, dialog };
};

const createHeader =
	(label) =>
	({ column }) =>
		(
			<button className="flex" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				{label} <ArrowUpDown className="ml-2 h-4 w-4" />
			</button>
		);
