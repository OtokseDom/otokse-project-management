"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axiosClient from "@/axios.client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContextProvider";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { API } from "@/constants/api";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";

const formSchema = z.object({
	name: z.string().refine((data) => data.trim() !== "", {
		message: "Name is required.",
	}),
	description: z.string().refine((data) => data.trim() !== "", {
		message: "Description is required.",
	}),
	color: z.string().refine((data) => data.trim() !== "", {
		message: "Color is required.",
	}),
});
export default function TaskStatusForm({ setIsOpen, updateData, setUpdateData }) {
	const { user } = useAuthContext();
	const { updateTaskStatus, addTaskStatus, taskStatusesLoading, setTaskStatusesLoading } = useTaskStatusesStore();
	const { addKanbanColumn } = useKanbanColumnsStore();
	const { fetchTasks } = useTaskHelpers();
	const showToast = useToast();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			color: "",
		},
	});

	useEffect(() => {
		if (updateData) {
			const { name, description, color } = updateData;
			form.reset({
				name,
				description,
				color,
			});
		}
	}, [updateData, form]);

	const handleSubmit = async (form) => {
		form.organization_id = user.data.organization_id;
		setTaskStatusesLoading(true);
		try {
			if (Object.keys(updateData).length === 0) {
				const taskStatusResponse = await axiosClient.post(API().task_status(), form);
				addTaskStatus(taskStatusResponse.data.data.status);
				addKanbanColumn(taskStatusResponse.data.data.kanban);
				showToast("Success!", "Task Status added.", 3000);
			} else {
				await axiosClient.put(API().task_status(updateData?.id), form);
				updateTaskStatus(updateData.id, form);
				showToast("Success!", "Task Status updated.", 3000);
			}
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			console.error("Error fetching data:", e);
		} finally {
			setUpdateData({});
			fetchTasks();
			setTaskStatusesLoading(false);
			setIsOpen(false);
		}
	};
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 max-w-md w-full">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="Task status name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
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
				<FormField
					control={form.control}
					name="color"
					render={({ field }) => {
						const colors = [
							{ id: 1, name: "Yellow" },
							{ id: 2, name: "Blue" },
							{ id: 3, name: "Green" },
							{ id: 4, name: "Gray" },
							{ id: 5, name: "Orange" },
							{ id: 6, name: "Purple" },
							{ id: 7, name: "Red" },
						];
						return (
							<FormItem>
								<FormLabel>Color</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={updateData?.color?.replace(/\b\w/g, (c) => c.toUpperCase()) || field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a color"></SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(colors) && colors.length > 0 ? (
											colors?.map((color) => (
												<SelectItem key={color.id} value={color.name}>
													{color.name}
												</SelectItem>
											))
										) : (
											<SelectItem disabled>No colors available</SelectItem>
										)}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<Button type="submit" disabled={taskStatusesLoading}>
					{taskStatusesLoading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />}{" "}
					{Object.keys(updateData).length === 0 ? "Submit" : "Update"}
				</Button>
			</form>
		</Form>
	);
}
