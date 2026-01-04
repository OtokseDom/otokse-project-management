"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Calendar
import { format, parseISO } from "date-fns";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContextProvider";
import axiosClient from "@/axios.client";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import DateInput from "@/components/form/DateInput";
import { API } from "@/constants/api";
import { useUsersStore } from "@/store/users/usersStore";
import { useUserStore } from "@/store/user/userStore";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";

const formSchema = z.object({
	name: z.string().refine((data) => data.trim() !== "", {
		message: "Name is required.",
	}),
	position: z.string().optional(),
	dob: z.date().optional(),
	role: z.string().refine((data) => data.trim() !== "", {
		message: "Role is required.",
	}),
	email: z.string().refine((data) => data.trim() !== "", {
		message: "Email is required.",
	}),
	status: z.string().refine((data) => data.trim() !== "", {
		message: "Status is required.",
	}),
	password: z.string().optional(),
});

export default function UserForm({ setIsOpen, updateData, userProfileId }) {
	const { user: user_auth, setUser } = useAuthContext();
	const showToast = useToast();
	const { addUser, updateUser, usersLoading, setUsersLoading } = useUsersStore();
	const { setUser: setProfileUser } = useUserStore();
	const { addUserFilter, updateUserFilter } = useDashboardStore();
	const { fetchTasks } = useTaskHelpers();
	const { addOption } = useTasksStore();
	const [showPassword, setShowPassword] = useState(false);

	const [date, setDate] = useState();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			position: "",
			dob: undefined,
			role: "",
			email: "",
			status: "",
			password: "",
		},
	});
	useEffect(() => {
		if (updateData) {
			const { name, position, dob, role, email, status, password } = updateData;
			form.reset({
				name,
				position,
				dob: dob ? parseISO(dob) : undefined,
				role,
				email,
				status,
				password,
			});
			setDate(dob ? parseISO(dob) : undefined);
		}
	}, [updateData, form]);

	const handleSubmit = async (form) => {
		let formattedData = {
			...form,
			organization_id: user_auth.data.organization_id,
			dob: form.dob ? format(form.dob, "yyyy-MM-dd") : null, // Format to Y-m-d
			password: "$2y$12$tXliF33idwwMmvk1tiF.ZOotEsqQnuWinaX90NLaw.rEchjbEAXCW", //default: admin123
		};
		// Remove password field if empty during update
		if (Object.keys(updateData).length !== 0 && form.password !== "") {
			formattedData.password = form.password;
		} else if (Object.keys(updateData).length !== 0 && form.password === "") {
			delete formattedData.password;
		}
		setUsersLoading(true);
		try {
			if (Object.keys(updateData).length === 0) {
				const userResponse = await axiosClient.post(API().user(), formattedData);
				addUser(userResponse.data.data);
				addOption({ value: userResponse.data.data.id, label: userResponse.data.data.name });
				addUserFilter(userResponse.data.data);
				showToast("Success!", "User added. Default password is 'admin123'", 3000);
			} else {
				const userResponse = await axiosClient.put(API().user(updateData?.id), formattedData);
				updateUser(updateData.id, userResponse.data.data);
				updateUserFilter(updateData?.id, { label: userResponse.data.data.name });
				if (userProfileId) setProfileUser(userResponse.data.data);
				// Update auth user data if the updated user is the current logged-in user
				const formattedAuthData = { data: userResponse.data.data };
				if (user_auth.data.id === updateData?.id) setUser(formattedAuthData);
				showToast("Success!", "User updated.", 3000);
			}
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			console.error("Error fetching data:", e);
		} finally {
			fetchTasks();
			setUsersLoading(false);
			setIsOpen(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 max-w-md w-full">
				{user_auth?.data?.role !== "Employee" && (
					<FormField
						control={form.control}
						name="status"
						render={({ field }) => {
							const statuses = [
								{ id: 1, name: "Pending" },
								{ id: 2, name: "Active" },
								{ id: 3, name: "Inactive" },
								{ id: 4, name: "Rejected" },
								{ id: 5, name: "Banned" },
							];
							return (
								<FormItem>
									<FormLabel>Status</FormLabel>
									<Select
										disabled={user_auth?.data?.role === "Employee"}
										onValueChange={field.onChange}
										defaultValue={updateData?.status || field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a status"></SelectValue>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Array.isArray(statuses) && statuses.length > 0 ? (
												statuses?.map((status) => (
													<SelectItem key={status?.id} value={status?.name.toLowerCase()}>
														{status?.name}
													</SelectItem>
												))
											) : (
												<SelectItem disabled>No statuses available</SelectItem>
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
				)}
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="User name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				{user_auth?.data?.role !== "Employee" && (
					<FormField
						control={form.control}
						name="role"
						render={({ field }) => {
							const roles = [
								{ id: 1, name: "Superadmin" },
								{ id: 2, name: "Admin" },
								{ id: 3, name: "Manager" },
								{ id: 4, name: "Employee" },
							];
							return (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={updateData?.role || field.value}
										disabled={user_auth?.data?.role === "Employee"}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role"></SelectValue>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{Array.isArray(roles) && roles.length > 0 ? (
												roles?.map((role) => (
													<SelectItem key={role?.id} value={role?.name}>
														{role?.name}
													</SelectItem>
												))
											) : (
												<SelectItem disabled>No roles available</SelectItem>
											)}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
				)}
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="Email" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					control={form.control}
					name="position"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Position</FormLabel>
								<FormControl>
									<Input placeholder="User position" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					control={form.control}
					name="dob"
					render={({ field }) => {
						return <DateInput field={field} label={"Birthday"} placeholder={"Pick a date"} disableFuture={true} />;
					}}
				/>
				{(user_auth?.data?.role !== "Employee" && user_auth?.data?.role !== "Manager") || user_auth?.data?.id === parseInt(updateData?.id) ? (
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<div className="flex items-start gap-2">
										<FormControl>
											<Input type={showPassword ? "text" : "password"} placeholder="Password" {...field} />
										</FormControl>
										{showPassword ? (
											<EyeOff size={24} className="mt-2 hover:cursor-pointer" onClick={() => setShowPassword(false)} />
										) : (
											<Eye size={24} className="mt-2 hover:cursor-pointer" onClick={() => setShowPassword(true)} />
										)}
									</div>
									<p className="text-muted-foreground text-xs">Leave empty to keep the current password.</p>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
				) : (
					""
				)}
				<div className="flex gap-2 w-full">
					<Button variant="secondary" type="button" className="w-full" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={usersLoading} className="w-full">
						{usersLoading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />}{" "}
						{Object.keys(updateData).length === 0 ? "Submit" : "Update"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
