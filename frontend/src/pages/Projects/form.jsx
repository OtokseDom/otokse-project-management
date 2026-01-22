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
import { CalendarDays, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/contexts/ToastContextProvider";
import { useEffect, useState } from "react";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { API } from "@/constants/api";
import { format, parseISO } from "date-fns";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useEpicsStore } from "@/store/epics/epicsStore";
import { useEpicStore } from "@/store/epic/epicStore";
const formSchema = z.object({
	epic_id: z.number().optional(),
	title: z.string().refine((data) => data.trim() !== "", {
		message: "Title is required.",
	}),
	description: z.string().optional(),
	// target_date: z.date().optional(),
	// estimated_date: z.date().optional(),
	start_date: z.date().nullable(),
	end_date: z.date().nullable(),
	actual_date: z.date().nullable(),
	days_estimate: z.coerce.number().optional(),
	days_taken: z.coerce.number().optional(),
	delay_days: z.coerce.number().optional(),
	delay_reason: z.string().optional(),
	remarks: z.string().optional(),
	priority: z.string().optional(),
	status_id: z.number().optional(),
});

export default function ProjectForm({ setIsOpen, updateData, setUpdateData }) {
	const { user: user_auth } = useAuthContext();
	const showToast = useToast();
	const { epics } = useEpicsStore();
	const { selectedEpicId } = useEpicStore();
	const { addProject, updateProject, projectsLoading, setProjectsLoading } = useProjectsStore([]);
	const { updateProjectFilter, addProjectFilter } = useDashboardStore();
	const { addKanbanColumn } = useKanbanColumnsStore();
	const { fetchTasks } = useTaskHelpers();
	const { taskStatuses } = useTaskStatusesStore();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			epic_id: undefined,
			title: "",
			description: "",
			// target_date: undefined,
			// estimated_date: undefined,
			start_date: null,
			end_date: null,
			actual_date: null,
			days_estimate: "",
			days_taken: "",
			delay_days: "",
			delay_reason: "",
			priority: "",
			remarks: "",
			status_id: undefined,
		},
	});

	const [autoCalculateErrors, setAutoCalculateErrors] = useState({
		days_estimate: "",
		days_taken: "",
		delay_days: "",
	});
	useEffect(() => {
		if (updateData) {
			const {
				epic_id,
				title,
				description,
				start_date,
				end_date,
				actual_date,
				days_estimate,
				days_taken,
				delay_days,
				delay_reason,
				priority,
				remarks,
				status_id,
			} = updateData;
			form.reset({
				epic_id: epic_id || selectedEpicId || undefined,
				title: title || "",
				description: description || "",
				start_date: start_date ? parseISO(start_date) : null,
				end_date: end_date ? parseISO(end_date) : null,
				actual_date: actual_date ? parseISO(actual_date) : null,
				days_estimate: days_estimate || undefined,
				days_taken: days_taken || undefined,
				delay_days: delay_days || undefined,
				delay_reason: delay_reason || "",
				priority: priority || "",
				remarks: remarks || "",
				status_id: status_id || undefined,
			});
		}
	}, [updateData, form]);
	const calculateField = (type) => {
		const values = form.getValues();
		// Helper for time parsing
		const parseTime = (t) => {
			if (!t) return 0;
			const [h, m, s] = t.split(":").map(Number);
			return h * 60 + m + (s ? s / 60 : 0);
		};
		// Helper for date parsing
		const parseDate = (d) => {
			if (!d) return null;
			if (typeof d === "string") return new Date(d);
			return d;
		};
		try {
			switch (type) {
				case "days_estimate": {
					const start = parseDate(values.start_date);
					const end = parseDate(values.end_date);
					if (start && end) {
						setAutoCalculateErrors((prev) => ({ ...prev, days_estimate: "" }));
						const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
						if (diff <= 0) setAutoCalculateErrors((prev) => ({ ...prev, days_estimate: "End date should be same or past the start date" }));
						else form.setValue("days_estimate", diff);
					} else {
						setAutoCalculateErrors((prev) => ({ ...prev, days_estimate: "Start and End Date is required to calculate Days Estimate" }));
					}
					break;
				}
				case "days_taken": {
					const start = parseDate(values.start_date);
					const actual = parseDate(values.actual_date);
					if (start && actual) {
						setAutoCalculateErrors((prev) => ({ ...prev, days_taken: "" }));
						const diff = Math.ceil((actual - start) / (1000 * 60 * 60 * 24)) + 1;
						if (diff <= 0) setAutoCalculateErrors((prev) => ({ ...prev, days_taken: "Actual date should be same or past the start date" }));
						else form.setValue("days_taken", diff);
					} else {
						setAutoCalculateErrors((prev) => ({ ...prev, days_taken: "Start and Actual Date is required to calculate Days Taken" }));
					}
					break;
				}
				case "delay_days": {
					const est = Number(values.days_estimate);
					const taken = Number(values.days_taken);
					if (est && taken) {
						setAutoCalculateErrors((prev) => ({ ...prev, delay_days: "" }));
						const delay = taken - est;
						form.setValue("delay_days", delay > 0 ? delay : 0);
					} else {
						setAutoCalculateErrors((prev) => ({ ...prev, delay_days: "Estimate and Taken Days is required to calculate Days Taken" }));
					}
					break;
				}
				default:
					break;
			}
		} catch (e) {
			console.log(e);
		}
	};
	const handleSubmit = async (form) => {
		setProjectsLoading(true);
		try {
			const parsedForm = {
				...form,
				organization_id: user_auth.data.organization_id,
				// target_date: form.target_date ? format(form.target_date, "yyyy-MM-dd") : null,
				// estimated_date: form.estimated_date ? format(form.estimated_date, "yyyy-MM-dd") : null,
				start_date: form.start_date ? format(form.start_date, "yyyy-MM-dd") : null,
				end_date: form.end_date ? format(form.end_date, "yyyy-MM-dd") : null,
				actual_date: form.actual_date ? format(form.actual_date, "yyyy-MM-dd") : null,
			};
			if (Object.keys(updateData).length === 0) {
				const projectResponse = await axiosClient.post(API().project(), parsedForm);
				addProject(projectResponse.data.data.project);
				addKanbanColumn(projectResponse.data.data.kanban);
				addProjectFilter(projectResponse.data.data.project);
				showToast("Success!", "Project added.", 3000);
			} else {
				const projectResponse = await axiosClient.put(API().project(updateData?.id), parsedForm);
				updateProject(updateData?.id, projectResponse.data.data);
				updateProjectFilter(updateData?.id, { label: projectResponse.data.data.title });
				showToast("Success!", "Project updated.", 3000);
			}
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			console.error("Error fetching data:", e);
		} finally {
			setUpdateData({});
			fetchTasks();
			setProjectsLoading(false);
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
					name="epic_id"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Epic</FormLabel>
								<Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? field.value.toString() : ""}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select an epic">
												{field.value ? epics?.find((epic) => epic.id == field.value).title : "Select an epic"}
											</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(epics) && epics.length > 0 ? (
											epics.map((epic) => (
												<SelectItem key={epic.id} value={epic.id.toString()}>
													{epic.title}
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
									<Input placeholder="Project title" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
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
				{/* <FormField
					control={form.control}
					name="target_date"
					render={({ field }) => {
						return <DateInput field={field} label={"Target date"} placeholder={"Select target date"} />;
					}}
				/>
				<FormField
					control={form.control}
					name="estimated_date"
					render={({ field }) => {
						return <DateInput field={field} label={"Estimated date"} placeholder={"Select estimated date"} />;
					}}
				/> */}
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
					<div className="flex flex-col md:flex-row justify-between gap-4">
						<FormField
							control={form.control}
							name="days_estimate"
							render={({ field }) => {
								return (
									<FormItem className="w-full">
										<FormLabel>
											<div title="Auto calculate days estimate" className="flex flex-row justify-between">
												<span>Days Estimate</span>
												<Sparkles
													size={16}
													className="text-muted-foreground hover:text-primary hover:cursor-pointer"
													onClick={() => calculateField("days_estimate")}
												/>
											</div>
										</FormLabel>
										<FormControl>
											<div>
												<Input disabled={!isEditable} type="number" step="any" placeholder="Days estimate" {...field} />
												{autoCalculateErrors.days_estimate !== "" ? (
													<span className="text-destructive">{autoCalculateErrors.days_estimate}</span>
												) : (
													""
												)}
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="actual_date"
							render={({ field }) => {
								return (
									<DateInput
										disabled={!isEditable}
										field={field}
										label={<div>Actual Date</div>}
										placeholder={"Select actual date"}
										className="w-full"
									/>
								);
							}}
						/>
					</div>
					<div className="flex flex-row justify-between gap-4">
						<FormField
							control={form.control}
							name="days_taken"
							render={({ field }) => {
								return (
									<FormItem className="w-full">
										<FormLabel>
											<div title="Auto calculate days taken" className="flex flex-row justify-between">
												<span>Days Taken</span>
												<Sparkles
													size={16}
													className="text-muted-foreground hover:text-primary hover:cursor-pointer"
													onClick={() => calculateField("days_taken")}
												/>
											</div>
										</FormLabel>
										<FormControl>
											<div>
												<Input disabled={!isEditable} type="number" step="any" placeholder="Days taken" {...field} />
												{autoCalculateErrors.days_taken !== "" ? (
													<span className="text-destructive">{autoCalculateErrors.days_taken}</span>
												) : (
													""
												)}
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="delay_days"
							render={({ field }) => {
								return (
									<FormItem className="w-full">
										<FormLabel>
											<div title="Auto calculate days delayed" className="flex flex-row justify-between">
												<span>Days Delayed</span>
												<Sparkles
													size={16}
													className="text-muted-foreground hover:text-primary hover:cursor-pointer"
													onClick={() => calculateField("delay_days")}
												/>
											</div>
										</FormLabel>
										<FormControl>
											<div>
												<Input disabled={!isEditable} type="number" step="any" placeholder="Days delayed" {...field} />
												{autoCalculateErrors.delay_days !== "" ? (
													<span className="text-destructive">{autoCalculateErrors.delay_days}</span>
												) : (
													""
												)}
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								);
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

				<div className="flex gap-2 w-full">
					<Button variant="secondary" type="button" className="w-full" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					{isEditable && (
						<Button type="submit" disabled={projectsLoading} className="w-full">
							{projectsLoading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />}{" "}
							{Object.keys(updateData).length === 0 ? "Submit" : "Update"}
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}
