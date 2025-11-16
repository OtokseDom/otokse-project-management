"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import DateInput from "@/components/form/DateInput";
import { useTasksStore } from "@/store/tasks/tasksStore";
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useUsersStore } from "@/store/users/usersStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useToast } from "@/contexts/ToastContextProvider";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { format } from "date-fns";

const formSchema = z.object({
	status_id: z.number().optional(),
	project_id: z.number().optional(),
	category_id: z.number().optional(),
	priority: z.string().optional(),
	start_date: z.date().optional().nullable(),
	end_date: z.date().optional().nullable(),
	actual_date: z.date().optional().nullable(),
});
export default function UpdateDialog({ open, onClose, action, selectedTasks = [] }) {
	const { loading, setLoading } = useLoadContext();
	const showToast = useToast();
	const { options } = useTasksStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { projects } = useProjectsStore();
	const { categories } = useCategoriesStore();
	const [selectedAssignees, setSelectedAssignees] = useState(Array.from(new Set(selectedTasks?.flatMap((t) => t.assignees?.map((a) => a.id)) || [])));
	const { fetchTasks, fetchReports } = useTaskHelpers();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			status_id: undefined,
			project_id: undefined,
			category: undefined,
			priority: "",
			start_date: undefined,
			end_date: undefined,
			actual_date: undefined,
		},
	});
	const handleBulkUpdate = async (action, data, tasks) => {
		const ids = tasks.map((t) => t.id);
		let value;
		switch (action) {
			case "status":
				value = data.status_id;
				break;
			case "assignees":
				value = data.assignees;
				break;
			case "project":
				value = data.project_id;
				break;
			case "category":
				value = data.category_id;
				break;
			case "priority":
				value = data.priority;
				break;
			case "start_date":
				value = data.start_date ? format(data.start_date, "yyyy-MM-dd") : null;
				break;
			case "end_date":
				value = data.end_date ? format(data.end_date, "yyyy-MM-dd") : null;
				break;
			case "actual_date":
				value = data.actual_date ? format(data.actual_date, "yyyy-MM-dd") : null;
				break;
			default:
				return;
		}
		try {
			setLoading(true);
			await axiosClient.patch(API().task_bulk_update(), {
				ids,
				action,
				value,
			});
			fetchTasks();
			fetchReports();
			showToast("Success!", "Tasks' " + action.toUpperCase() + " updated.", 3000);
		} catch (e) {
			// Optionally show error toast
			console.error("Bulk update failed", e);
			showToast("Bulk update failed", e.message, 3000, "fail");
		} finally {
			setLoading(false);
		}
	};
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Bulk Update{" "}
						{action &&
							action
								.split("_")
								.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
								.join(" ")}
					</DialogTitle>
					<DialogDescription>Update selected tasks</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((data) => {
							handleBulkUpdate(action, { ...data, assignees: selectedAssignees }, selectedTasks);
							onClose();
						})}
					>
						<div className="flex flex-col gap-4">
							{action === "status" && (
								<FormField
									control={form.control}
									name="status_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Status</FormLabel>
											<Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? field.value.toString() : ""}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a status" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{taskStatuses?.map((s) => (
														<SelectItem key={s.id} value={s.id.toString()}>
															{s.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							)}

							{action === "assignees" && (
								<FormField
									control={form.control}
									name="assignees"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Assignees</FormLabel>
											<FormControl>
												<MultiSelect
													options={options || []} // users
													defaultValue={selectedAssignees} // preselect
													onValueChange={setSelectedAssignees}
													placeholder="Select assignees"
													variant="inverted"
													animation={2}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							)}

							{action === "project" && (
								<FormField
									control={form.control}
									name="project_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Project</FormLabel>
											<Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? field.value.toString() : ""}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a project" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{projects?.map((p) => (
														<SelectItem key={p.id} value={p.id.toString()}>
															{p.title}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							)}

							{action === "category" && (
								<FormField
									control={form.control}
									name="category_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Category</FormLabel>
											<Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? field.value.toString() : ""}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a category" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{categories?.map((c) => (
														<SelectItem key={c.id} value={c.id.toString()}>
															{c.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							)}

							{action === "priority" && (
								<FormField
									control={form.control}
									name="priority"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Priority</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select priority" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{["Low", "Medium", "High", "Urgent", "Critical"].map((priority) => (
														<SelectItem key={priority} value={priority}>
															{priority}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormItem>
									)}
								/>
							)}

							{(action === "start_date" || action === "end_date" || action === "actual_date") && (
								<FormField
									control={form.control}
									name={action}
									render={({ field }) => {
										return (
											<DateInput
												field={field}
												label={action
													.split("_")
													.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
													.join(" ")}
												placeholder={`Select ${action.split("_").join(" ")}`}
												className="w-full"
											/>
										);
									}}
								/>
							)}

							<DialogFooter>
								<Button type="button" variant="secondary" onClick={onClose}>
									Cancel
								</Button>
								<Button type="submit">Update</Button>
							</DialogFooter>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
