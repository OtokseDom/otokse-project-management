"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import DateInput from "@/components/form/DateInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axiosClient from "@/axios.client";
import { CalendarDays, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContextProvider";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { API } from "@/constants/api";
import { format, parseISO } from "date-fns";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
// import { useTaskHelpers } from "@/utils/taskHelpers";
// import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";
// import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useEpicsStore } from "@/store/epics/epicsStore";
import { useUsersStore } from "@/store/users/usersStore";
import { useEpicStore } from "@/store/epic/epicStore";
import { useEpicHelpers } from "@/utils/epicHelpers";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const formSchema = z.object({
	status_id: z.number().optional(),
	owner_id: z.number().optional(),
	title: z.string().refine((data) => data.trim() !== "", {
		message: "Title is required.",
	}),
	slug: z
		.string()
		.trim()
		.transform((v) => (v === "" ? undefined : v))
		.refine((v) => v === undefined || slugRegex.test(v), {
			message: "Slug must be lowercase, contain only letters, numbers, and hyphens, and have no spaces.",
		})
		.optional(),
	description: z.string().optional(),
	start_date: z.date().nullable(),
	end_date: z.date().nullable(),
	remarks: z.string().optional(),
	priority: z.string().optional(),
});

export default function EpicForm() {
	const { user: user_auth } = useAuthContext();
	const showToast = useToast();
	const { addEpic, updateEpic, epicsLoading, setEpicsLoading } = useEpicsStore([]);
	const { setIsOpen, updateData, setUpdateData } = useEpicStore();
	const { fetchEpic } = useEpicHelpers();

	const { users } = useUsersStore();
	// const { updateEpicFilter, addEpicFilter } = useDashboardStore();
	// const { addKanbanColumn } = useKanbanColumnsStore();
	// const { fetchTasks } = useTaskHelpers();
	const { taskStatuses } = useTaskStatusesStore();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			status_id: undefined,
			owner_id: undefined,
			title: "",
			description: "",
			slug: "",
			start_date: null,
			end_date: null,
			priority: "",
			remarks: "",
		},
	});
	useEffect(() => {
		if (updateData) {
			const { status_id, owner_id, title, slug, description, start_date, end_date, priority, remarks } = updateData;
			form.reset({
				status_id: status_id || undefined,
				owner_id: owner_id || undefined,
				title: title || "",
				slug: slug || "",
				description: description || "",
				start_date: start_date ? parseISO(start_date) : null,
				end_date: end_date ? parseISO(end_date) : null,
				priority: priority || "",
				remarks: remarks || "",
			});
		}
	}, [updateData, form]);

	const handleSubmit = async (form) => {
		setEpicsLoading(true);
		try {
			const parsedForm = {
				...form,
				organization_id: user_auth.data.organization_id,
				start_date: form.start_date ? format(form.start_date, "yyyy-MM-dd") : null,
				end_date: form.end_date ? format(form.end_date, "yyyy-MM-dd") : null,
			};
			if (Object.keys(updateData).length === 0) {
				const epicResponse = await axiosClient.post(API().epic(), parsedForm);
				addEpic(epicResponse.data.data.epic);
				// addKanbanColumn(epicResponse.data.data.kanban);
				// addEpicFilter(epicResponse.data.data.epic);
				showToast("Success!", "Epic added.", 3000);
			} else {
				const epicResponse = await axiosClient.put(API().epic(updateData?.id), parsedForm);
				updateEpic(updateData?.id, epicResponse.data.data);
				fetchEpic(updateData?.id);
				// updateEpicFilter(updateData?.id, { label: epicResponse.data.data.title });
				showToast("Success!", "Epic updated.", 3000);
			}
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			console.error("Error fetching data:", e);
		} finally {
			setUpdateData({});
			// fetchTasks();
			setEpicsLoading(false);
			setIsOpen(false);
		}
	};

	const isEditable =
		user_auth?.data?.role === "Superadmin" ||
		user_auth?.data?.role === "Admin" ||
		user_auth?.data?.role === "Manager" ||
		Object.keys(updateData).length === 0;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 max-w-md w-full">
				<FormField
					disabled={!isEditable}
					control={form.control}
					name="status_id"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Status</FormLabel>
								<Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? field.value.toString() : ""}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a status">
												{field.value ? taskStatuses?.find((taskStatus) => taskStatus.id == field.value).name : "Select a status"}
											</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(taskStatuses) && taskStatuses.length > 0 ? (
											taskStatuses.map((taskStatus) => (
												<SelectItem key={taskStatus.id} value={taskStatus.id.toString()}>
													{taskStatus.name}
												</SelectItem>
											))
										) : (
											<></>
										)}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					disabled={!isEditable}
					control={form.control}
					name="owner_id"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Owner</FormLabel>
								<Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? field.value.toString() : ""}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select an owner">
												{field.value ? users?.find((user) => user.id == field.value).name : "Select an owner"}
											</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(users) && users.length > 0 ? (
											users.map((user) => (
												<SelectItem key={user.id} value={user.id.toString()}>
													{user.name}
												</SelectItem>
											))
										) : (
											<></>
										)}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					disabled={!isEditable}
					control={form.control}
					name="title"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input placeholder="Epic title" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				{Object.keys(updateData).length !== 0 && (
					<FormField
						disabled={!isEditable}
						control={form.control}
						name="slug"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Slug</FormLabel>
									<FormControl>
										<Input placeholder="Epic slug" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							);
						}}
					/>
				)}
				<FormField
					disabled={!isEditable}
					control={form.control}
					name="description"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea placeholder="Description" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<div className="flex flex-col gap-4 bg-secondary p-4 rounded-lg">
					<div className="flex flex-row items-center justify-start gap-2 w-full font-medium text-base text-muted-foreground">
						<CalendarDays size={20} /> Date Details
					</div>
					<div className="flex flex-col md:flex-row justify-between gap-4">
						<FormField
							control={form.control}
							name="start_date"
							render={({ field }) => {
								return (
									<DateInput disabled={!isEditable} field={field} label={"Start date"} placeholder={"Select start date"} className="w-full" />
								);
							}}
						/>
						<FormField
							control={form.control}
							name="end_date"
							render={({ field }) => {
								return <DateInput disabled={!isEditable} field={field} label={"End date"} placeholder={"Select end date"} className="w-full" />;
							}}
						/>
					</div>
				</div>
				<FormField
					disabled={!isEditable}
					control={form.control}
					name="remarks"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Remarks</FormLabel>
								<FormControl>
									<Textarea placeholder="Remarks" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					disabled={!isEditable}
					control={form.control}
					name="priority"
					render={({ field }) => {
						const priorities = [
							{ id: 1, name: "Low" },
							{ id: 2, name: "Medium" },
							{ id: 3, name: "High" },
							{ id: 4, name: "Urgent" },
							{ id: 5, name: "Critical" },
						];
						return (
							<FormItem>
								<FormLabel>Priority</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={updateData?.priority || field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select priority"></SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(priorities) && priorities.length > 0 ? (
											priorities?.map((priority) => (
												<SelectItem key={priority?.id} value={priority?.name}>
													{priority?.name}
												</SelectItem>
											))
										) : (
											<SelectItem disabled>No priority available</SelectItem>
										)}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<div className="flex gap-2 w-full">
					<Button variant="secondary" type="button" className="w-full" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					{isEditable && (
						<Button type="submit" disabled={epicsLoading} className="w-full">
							{epicsLoading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />}{" "}
							{Object.keys(updateData).length === 0 ? "Submit" : "Update"}
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}
