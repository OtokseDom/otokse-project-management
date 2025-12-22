"use client";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { Edit, User2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import axiosClient from "@/axios.client";
import { useToast } from "@/contexts/ToastContextProvider";
import { useNavigate } from "react-router-dom";
import { API } from "@/constants/api";
import { useUserStore } from "@/store/user/userStore";
import { useUsersStore } from "@/store/users/usersStore";

export default function UserDetails({ setIsOpenUser, setDetailsLoading, detailsLoading }) {
	const { user: user_auth, setUser } = useAuthContext();
	const { setLoading } = useLoadContext();
	const showToast = useToast();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogType, setDialogType] = useState(null);
	const { user } = useUserStore();
	const { removeUser } = useUsersStore();
	const navigate = useNavigate();

	const openDialog = (type) => {
		setDialogType(type);
		setDialogOpen(true);
	};
	const handleApproval = async (id) => {
		setDetailsLoading(true);
		try {
			const form = {
				...user,
				status: "active",
			};
			try {
				const userResponse = await axiosClient.put(API().user(id), form);
				setUser(userResponse?.data?.data);
				showToast("Success!", userResponse?.data?.message, 3000);
			} catch (e) {
				showToast("Failed!", e.response?.data?.message, 3000, "fail");
				if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
			}
			// }
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			// Always stop loading when done
			setDetailsLoading(false);
		}
	};
	const handleDelete = async (id) => {
		setLoading(true);
		try {
			const userResponse = await axiosClient.delete(API().user(id));
			navigate("/users");
			removeUser(id);
			showToast("Success!", userResponse?.data?.message, 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			console.error("Error fetching data:", e);
		} finally {
			setLoading(false);
		}
	};

	const { name = "Not Found", position = "", email = "", role = "", status = "", dob = "" } = user || {};

	const isEditable =
		user_auth?.data?.role === "Superadmin" || user_auth?.data?.role === "Admin" || user_auth?.data?.role === "Manager" || user_auth?.data?.id === user?.id;

	return (
		<div className="absolute inset-0 flex flex-col justify-center items-start p-6 bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-indigo-900/20">
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex flex-row items-center gap-2">Are you absolutely sure?</DialogTitle>
						<DialogDescription>This action cannot be undone.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="secondary">
								Close
							</Button>
						</DialogClose>
						<DialogClose asChild>
							<Button onClick={() => handleDelete(user.id)}>{dialogType === "delete" ? "Yes, delete" : "Yes, reject"}</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>

				<div className="flex flex-col gap-3 w-full">
					{detailsLoading ? (
						<div className="flex gap-5">
							<Skeleton className="w-24 h-24 rounded-full" />
							<div className="flex flex-col gap-2">
								<Skeleton className="w-60 h-10 rounded-full" />
								<Skeleton className="w-60 h-10 rounded-full" />
							</div>
						</div>
					) : (
						<div className="flex items-start justify-between w-full">
							<div className="flex gap-5 items-center">
								<div>
									{/* <div className="w-24 h-24 bg-foreground rounded-full"></div> */}
									<User2 className="text-white" size={80} />
								</div>
								<div className="w-full">
									<span className="flex gap-3 text-md md:text-3xl font-bold text-white mb-0 md:mb-2">{name}</span>
									<span className="text-xs md:text-lg text-purple-200">{position}</span>
								</div>
							</div>

							{isEditable && (
								<DropdownMenu modal={false}>
									<DropdownMenuTrigger asChild>
										<Button variant="default" className="flex items-center bg-foreground text-background">
											<Edit size={20} />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										{user?.status == "pending" && (
											<>
												<DropdownMenuItem className="cursor-pointer text-green-500" onClick={() => handleApproval(user.id)}>
													Approve User
												</DropdownMenuItem>
												<DropdownMenuItem className="cursor-pointer text-red-500" onClick={() => openDialog("reject")}>
													Reject User
												</DropdownMenuItem>
												<hr />
											</>
										)}
										<button
											className="w-full text-left px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
											onClick={(e) => {
												e.stopPropagation();
												setIsOpenUser(true);
											}}
										>
											Update Account
										</button>
										<DropdownMenuItem onClick={() => openDialog("delete")}>
											<DialogTrigger asChild>
												<span className="cursor-pointer">Delete Account</span>
											</DialogTrigger>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</div>
					)}

					{detailsLoading ? (
						<div className="flex gap-5">
							<Skeleton className="w-24 h-8 rounded-full" />
							<Skeleton className="w-24 h-8 rounded-full" />
						</div>
					) : (
						<div className="flex flex-wrap mt-4 gap-2 md:gap-4">
							<div
								className={`backdrop-blur-sm px-3 py-1 w-fit rounded-full flex items-center ${
									status === "pending"
										? "text-yellow-100 bg-yellow-900/50"
										: status === "active"
										? "text-green-100 bg-green-900/50"
										: status === "inactive"
										? "text-gray-100 bg-gray-900/50"
										: status === "banned"
										? "text-red-100 bg-red-900/50"
										: ""
								}`}
							>
								{status}
							</div>
							<div className="bg-purple-900/50 backdrop-blur-sm px-3 py-1 w-fit rounded-full flex items-center text-purple-100">✨{role}</div>
							<div className="bg-indigo-900/50 backdrop-blur-sm px-3 py-1 w-fit rounded-full flex items-center text-indigo-100">🌌 {email}</div>
						</div>
					)}
				</div>
			</Dialog>
		</div>
	);
}
