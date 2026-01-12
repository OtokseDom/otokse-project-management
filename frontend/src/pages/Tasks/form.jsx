"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axiosClient from "@/axios.client";
import { useToast } from "@/contexts/ToastContextProvider";
import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { AlarmClock, CalendarDays, Info, Loader2, Scale, Sparkles } from "lucide-react";
import DateInput from "@/components/form/DateInput";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { API } from "@/constants/api";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useUsersStore } from "@/store/users/usersStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { MultiSelect } from "@/components/ui/multi-select";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useUserStore } from "@/store/user/userStore";
import RichTextEditor from "@/components/ui/RichTextEditor";
import TaskAttachments from "@/components/task/Attachment";
// TODO: Auto fill project and epic when available
const formSchema = z.object({
	parent_id: z.number().optional(),
	status_id: z.number().optional(),
	// assignee_id: z.number().optional(),
	project_id: z.number().optional(),
	category_id: z.number().optional(),
	title: z.string().refine((data) => data.trim() !== "", {
		message: "Title is required.",
	}),
	description: z.string().optional(),
	// expected_output: z.string().optional(),
	weight: z.coerce.number().min(0).max(5).optional(),
	effort_estimate: z.coerce.number().min(0).max(100).optional(),
	effort_taken: z.coerce.number().min(0).max(100).optional(),
	start_date: z.date().nullable(),
	end_date: z.date().nullable(),
	actual_date: z.date().nullable(),
	days_estimate: z.coerce.number().optional(),
	days_taken: z.coerce.number().optional(),
	delay_days: z.coerce.number().optional(),
	start_time: z.string().optional(),
	end_time: z.string().optional(),
	actual_time: z.string().optional(),
	time_estimate: z.coerce.number().optional(),
	time_taken: z.coerce.number().optional(),
	delay: z.coerce.number().optional(),
	delay_reason: z.string().optional(),
	performance_rating: z.coerce.number().min(0).max(10).optional(),
	remarks: z.string().optional(),
	priority: z.string().optional(),
});
export default function TaskForm({ parentId, isOpen, setIsOpen, updateData, setUpdateData }) {
	const { fetchTasks, fetchReports, fetchUserReports } = useTaskHelpers();
	const { tasks, relations, setRelations, addRelation, selectedUser, setActiveTab, options, tasksLoading, setTasksLoading } = useTasksStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { users } = useUsersStore();
	const { user } = useUserStore();
	const { projects, selectedProject } = useProjectsStore();
	const { categories } = useCategoriesStore();
	const { user: user_auth } = useAuthContext();
	const showToast = useToast();
	const [showMore, setShowMore] = useState(true);
	const parentTasks = () => {
		return tasks.filter((task) => task.parent_id == null && task.id !== updateData?.id) || [];
	};
	// const [taskImages, setTaskImages] = useState([]);
	const [attachments, setAttachments] = useState([]);
	const [existingAttachments, setExistingAttachments] = useState([]);

	// State for time_estimate and delay hour/minute fields
	const [timeEstimateHour, setTimeEstimateHour] = useState("");
	const [timeEstimateMinute, setTimeEstimateMinute] = useState("");
	const [timeTakenHour, setTimeTakenHour] = useState("");
	const [timeTakenMinute, setTimeTakenMinute] = useState("");
	const [delayHour, setDelayHour] = useState("");
	const [delayMinute, setDelayMinute] = useState("");
	const [autoCalculateErrors, setAutoCalculateErrors] = useState({
		days_estimate: "",
		days_taken: "",
		delay_days: "",
		time_estimate: "",
		time_taken: "",
		time_delay: "",
	});
	const [selectedUsers, setSelectedUsers] = useState(
		updateData?.assignees?.map((assignee) => parseInt(assignee.id)) || (updateData.calendar_add ? [selectedUser?.id] : []) || []
	);
	const bottomRef = useRef(null);
	const scrollToBottom = () => {
		setTimeout(() => {
			bottomRef.current?.scrollIntoView({ behavior: "smooth" });
		}, 1);
	};
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			calendar_add: false,
			kanban_add: false,
			status_id: undefined,
			title: "",
			description: "",
			parent_id: undefined,
			project_id: undefined,
			category: undefined,
			priority: "",
			// expected_output: "",
			weight: "",
			effort_estimate: "",
			effort_taken: "",
			start_date: null,
			end_date: null,
			actual_date: null,
			days_estimate: "",
			days_taken: "",
			delay_days: "",
			start_time: "",
			end_time: "",
			actual_time: "",
			time_estimate: "",
			time_taken: "",
			delay: "",
			delay_reason: "",
			performance_rating: "",
			remarks: "",
		},
	});

	useEffect(() => {
		if (!isOpen) {
			setUpdateData({});
		}
	}, [isOpen]);

	useEffect(() => {
		if (updateData && projects && users && categories) {
			const {
				calendar_add,
				kanban_add,
				status_id,
				title,
				description,
				parent_id,
				project_id,
				category_id,
				// expected_output,
				weight,
				effort_estimate,
				effort_taken,
				start_date,
				end_date,
				actual_date,
				days_estimate,
				days_taken,
				delay_days,
				start_time,
				end_time,
				actual_time,
				time_estimate,
				time_taken,
				delay,
				delay_reason,
				performance_rating,
				priority,
				remarks,
			} = updateData;
			form.reset({
				calendar_add: calendar_add || false,
				kanban_add: kanban_add || false,
				status_id: status_id || undefined,
				title: title || "",
				description: description || "",
				parent_id: parent_id || parentId || undefined,
				project_id: project_id || selectedProject?.id || undefined,
				category_id: category_id || undefined,
				// expected_output: expected_output || "",
				weight: weight || "",
				effort_estimate: effort_estimate || "",
				effort_taken: effort_taken || "",
				start_date: typeof start_date === "string" ? parseISO(start_date) : start_date || null,
				end_date: typeof end_date === "string" ? parseISO(end_date) : end_date || null,
				actual_date: typeof actual_date === "string" ? parseISO(actual_date) : actual_date || null,
				days_estimate: days_estimate || "",
				days_taken: days_taken || "",
				delay_days: delay_days || "",
				start_time: start_time || "",
				end_time: end_time || "",
				actual_time: actual_time || "",
				time_estimate: time_estimate || "",
				time_taken: time_taken || "",
				delay: delay || "",
				delay_reason: delay_reason || "",
				performance_rating: performance_rating || "",
				remarks: remarks || "",
				priority: priority || "",
			});
			// Set hour/minute fields for time_estimate, actual_time, and delay
			if (typeof time_estimate === "number" || (typeof time_estimate === "string" && time_estimate !== "")) {
				const te = parseFloat(time_estimate);
				setTimeEstimateHour(Math.floor(te).toString());
				setTimeEstimateMinute(Math.round((te % 1) * 60).toString());
			} else {
				setTimeEstimateHour("");
				setTimeEstimateMinute("");
			}
			if (typeof time_taken === "number" || (typeof time_taken === "string" && time_taken !== "")) {
				const d = parseFloat(time_taken);
				setTimeTakenHour(Math.floor(d).toString());
				setTimeTakenMinute(Math.round((d % 1) * 60).toString());
			} else {
				setTimeTakenHour("");
				setTimeTakenMinute("");
			}
			if (typeof delay === "number" || (typeof delay === "string" && delay !== "")) {
				const d = parseFloat(delay);
				setDelayHour(Math.floor(d).toString());
				setDelayMinute(Math.round((d % 1) * 60).toString());
			} else {
				setDelayHour("");
				setDelayMinute("");
			}
			// Load attachments for existing tasks
			if (updateData.attachments && Array.isArray(updateData.attachments)) {
				setExistingAttachments(updateData.attachments);
			} else {
				setExistingAttachments([]); // Reset for new tasks
			}
		}
	}, [updateData, form, projects, users, categories]);

	const handleSubmit = async (formData) => {
		setTasksLoading(true);
		try {
			// Parse numeric fields
			const formatTime = (time) => {
				if (!time) return "";
				if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
				if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
				return time;
			};

			// Calculate decimal values for time_estimate and delay
			const timeEstimateDecimal =
				timeEstimateHour || timeEstimateMinute ? parseInt(timeEstimateHour || "0", 10) + parseInt(timeEstimateMinute || "0", 10) / 60 : undefined;
			const timeTakenDecimal =
				timeTakenHour || timeTakenMinute ? parseInt(timeTakenHour || "0", 10) + parseInt(timeTakenMinute || "0", 10) / 60 : undefined;
			const delayDecimal = delayHour || delayMinute ? parseInt(delayHour || "0", 10) + parseInt(delayMinute || "0", 10) / 60 : undefined;

			const parsedForm = {
				...formData,
				organization_id: user_auth.data.organization_id,
				start_date: formData.start_date ? format(formData.start_date, "yyyy-MM-dd") : null,
				end_date: formData.end_date ? format(formData.end_date, "yyyy-MM-dd") : null,
				actual_date: formData.actual_date ? format(formData.actual_date, "yyyy-MM-dd") : null,
				start_time: formatTime(formData.start_time),
				end_time: formatTime(formData.end_time),
				actual_time: formatTime(formData.actual_time),
				time_estimate: timeEstimateDecimal !== undefined ? Number(timeEstimateDecimal.toFixed(2)) : undefined,
				time_taken: timeTakenDecimal !== undefined ? Number(timeTakenDecimal.toFixed(2)) : undefined,
				delay: delayDecimal !== undefined ? Number(delayDecimal.toFixed(2)) : undefined,
				performance_rating: formData.performance_rating ? parseInt(formData.performance_rating, 10) : null,
			};

			// Convert to FormData before sending
			const formDataToSend = new FormData();
			for (const [key, value] of Object.entries(parsedForm)) {
				if (key === "attachments" && Array.isArray(value)) {
					value.forEach((file) => formDataToSend.append("attachments[]", file));
				} else if (value !== null && value !== undefined) {
					formDataToSend.append(key, value);
				} else {
					formDataToSend.append(key, "");
				}
			}
			// Append assignees array (important: Laravel needs it as assignees[])
			if (selectedUsers && selectedUsers.length > 0) {
				selectedUsers.forEach((userId) => {
					formDataToSend.append("assignees[]", userId);
				});
			}

			// ✅ Append attachment files
			if (attachments.length > 0) {
				attachments.forEach((file) => {
					formDataToSend.append("attachments[]", file);
				});
			}
			if (Object.keys(updateData).length === 0 || updateData?.calendar_add || updateData?.kanban_add) {
				// ADD

				// Calculate new position
				const tasksInColumn = tasks.filter((t) => t.project_id === parsedForm.project_id && t.status_id === parsedForm.status_id);
				const maxPosition = tasksInColumn.length ? Math.max(...tasksInColumn.map((t) => t.position || 0)) : 0;
				// parsedForm.position = maxPosition + 1;
				formDataToSend.append("position", maxPosition + 1);

				// const taskResponse = await axiosClient.post(API().task(), parsedForm);
				const taskResponse = await axiosClient.post(API().task(), formDataToSend, {
					headers: { "Content-Type": "multipart/form-data" },
				});

				fetchTasks();
				showToast("Success!", "Task added.", 3000);
				// if add subtask, don't close sheet
				if (!parentId) setIsOpen(false);
				else {
					setActiveTab("relations");
					// to show 3 tabs again
					setUpdateData(taskResponse?.data?.data?.task);
					if (relations.children && relations?.children?.length !== 0) {
						// Setting new relations when added subtask
						addRelation(taskResponse.data.data.task);
					} else {
						// Setting new relations if adding subtask from task without relation
						const parentTask = tasks.find((task) => task.id === taskResponse.data.data.task.parent_id);
						setRelations({
							...parentTask,
							children: [...(parentTask.children || []), taskResponse.data.data.task],
						});
					}
				}
			} else {
				// UPDATE

				// Determine if project/status changed
				const originalProjectId = updateData.project_id;
				const originalStatusId = updateData.status_id;

				const projectChanged = parsedForm.project_id !== originalProjectId;
				const statusChanged = parsedForm.status_id !== originalStatusId;

				// Calculate new position if moved to a new column
				if (projectChanged || statusChanged) {
					const tasksInNewColumn = tasks.filter((t) => t.project_id === parsedForm.project_id && t.status_id === parsedForm.status_id);

					const maxPosition = tasksInNewColumn.length ? Math.max(...tasksInNewColumn.map((t) => t.position || 0)) : 0;

					// parsedForm.position = maxPosition + 1;
					formDataToSend.append("position", maxPosition + 1);
				} else {
					// Keep current position if column didn't change
					// parsedForm.position = updateData.position;
					formDataToSend.append("position", updateData.position);
				}
				// await axiosClient.put(API().task(updateData?.id), parsedForm);
				await axiosClient.post(API().task(updateData.id) + "?_method=PUT", formDataToSend, {
					headers: { "Content-Type": "multipart/form-data" },
				});
				// cannot update stores, need to update parent task
				fetchTasks();
				showToast("Success!", "Task updated.", 3000);
				setIsOpen(false);
				setUpdateData({});
			}
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			console.error("Error fetching data:", e);
			if (e.response?.data?.errors) {
				const backendErrors = e.response.data.errors;
				Object.keys(backendErrors).forEach((field) => {
					form.setError(field, {
						type: "backend",
						message: backendErrors[field][0],
					});
				});
			}
		} finally {
			setTasksLoading(false);
			fetchReports();
			setAttachments([]);
			if (user?.id && Array.isArray(formData.assignees) && formData.assignees.includes(user.id)) {
				fetchUserReports(user.id);
			}
		}
	};

	// Unified calculation function for all date/time fields
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
				case "time_estimate": {
					const start = values.start_time;
					const end = values.end_time;
					if (start && end) {
						setAutoCalculateErrors((prev) => ({ ...prev, time_estimate: "" }));
						let diff = parseTime(end) - parseTime(start);
						if (diff < 0) diff += 24 * 60;
						const hours = Math.floor(diff / 60);
						const minutes = Math.round(diff % 60);
						setTimeEstimateHour(hours.toString());
						setTimeEstimateMinute(minutes.toString());
						const decimal = hours + minutes / 60;
						form.setValue("time_estimate", Number(decimal.toFixed(2)));
					} else {
						setAutoCalculateErrors((prev) => ({ ...prev, time_estimate: "Start and End Time is required to calculate Time Estimate" }));
					}
					break;
				}
				case "time_taken": {
					const start = values.start_time;
					const actual = values.actual_time;
					if (start && actual) {
						setAutoCalculateErrors((prev) => ({ ...prev, time_taken: "" }));
						let diff = parseTime(actual) - parseTime(start);
						if (diff < 0) diff += 24 * 60;
						const hours = Math.floor(diff / 60);
						const minutes = Math.round(diff % 60);
						setTimeTakenHour(hours.toString());
						setTimeTakenMinute(minutes.toString());
						const decimal = hours + minutes / 60;
						form.setValue("time_taken", Number(decimal.toFixed(2)));
					} else {
						setAutoCalculateErrors((prev) => ({ ...prev, time_taken: "Start and Actual Time is required to calculate Time Taken" }));
					}
					break;
				}
				case "delay": {
					const est = Number(values.time_estimate);
					const taken = Number(values.time_taken);
					if (est && taken) {
						setAutoCalculateErrors((prev) => ({ ...prev, time_delay: "" }));
						let delay = taken - est;
						if (delay > 0) {
							const hours = Math.floor(delay);
							const minutes = Math.round((delay % 1) * 60);
							setDelayHour(hours.toString());
							setDelayMinute(minutes.toString());
							form.setValue("delay", Number(delay.toFixed(2)));
						} else {
							setDelayHour(0);
							setDelayMinute(0);
							// form.setValue("delay", 0);
						}
					} else {
						setAutoCalculateErrors((prev) => ({ ...prev, time_delay: "Estimate and Taken Time is required to calculate Delay" }));
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

	const isEditable =
		user_auth?.data?.role === "Superadmin" ||
		user_auth?.data?.role === "Admin" ||
		user_auth?.data?.role === "Manager" ||
		Object.keys(updateData).length === 0 ||
		updateData?.calendar_add ||
		updateData?.kanban_add ||
		updateData?.assignees?.some((assignee) => assignee.id === user_auth?.data?.id) ||
		!updateData?.assignees;
	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((formData) => {
					// Include selectedUsers in the formData object
					handleSubmit({ ...formData, assignees: selectedUsers });
				})}
				// onSubmit={form.handleSubmit(handleSubmit)}
				className="flex flex-col gap-4 w-full"
			>
				<FormField
					control={form.control}
					name="title"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>
									Title <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Input disabled={!isEditable} placeholder="Title" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								{/* <RichTextEditor value={field.value || ""} onChange={field.onChange} /> */}
								<RichTextEditor
									value={field.value || ""}
									onChange={field.onChange}
									// onImageDrop={handleImageDropFromEditor}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Input
					type="file"
					multiple
					onChange={(e) => setAttachments(Array.from(e.target.files))}
					className="cursor-pointer bg-secondary text-foreground"
				/>
				{/* Display existing attachments from database */}
				<TaskAttachments
					existingAttachments={existingAttachments}
					setExistingAttachments={setExistingAttachments}
					attachments={attachments}
					setAttachments={setAttachments}
				/>
				<div className="flex w-full gap-4">
					<FormField
						control={form.control}
						name="status_id"
						render={({ field }) => {
							return (
								<FormItem className="w-full">
									<FormLabel>Status</FormLabel>
									<Select
										disabled={!isEditable}
										onValueChange={(value) => field.onChange(Number(value))}
										value={field.value ? field.value.toString() : ""}
									>
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
								<FormItem className="w-full">
									<FormLabel>Priority</FormLabel>
									<Select disabled={!isEditable} onValueChange={field.onChange} defaultValue={updateData?.priority || field.value}>
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
				</div>
				<FormField
					control={form.control}
					name="assignees"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Assignees</FormLabel>
								<FormControl>
									<MultiSelect
										disabled={!isEditable}
										field={field}
										options={options || []}
										onValueChange={setSelectedUsers}
										defaultValue={selectedUsers}
										placeholder="Select assignees"
										variant="inverted"
										animation={2}
										// maxCount={3}
									/>
								</FormControl>
							</FormItem>
						);
					}}
				/>
				<FormField
					control={form.control}
					name="project_id"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Project</FormLabel>
								<Select
									disabled={!isEditable}
									onValueChange={(value) => field.onChange(Number(value))}
									value={field.value ? field.value.toString() : ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a project">
												{field.value ? projects?.find((project) => project.id == field.value)?.title : "Select a project"}
											</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(projects) && projects.length > 0 ? (
											projects.map((project) => (
												<SelectItem key={project.id} value={project.id.toString()}>
													{project.title}
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
					control={form.control}
					name="category_id"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Category</FormLabel>
								<Select
									disabled={!isEditable}
									onValueChange={(value) => field.onChange(Number(value))}
									value={field.value ? field.value.toString() : ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a category">
												{field.value ? categories?.find((category) => category.id == field.value)?.name : "Select a category"}
											</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(categories) && categories.length > 0 ? (
											categories.map((category) => (
												<SelectItem key={category.id} value={category.id.toString()}>
													{category.name}
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
					control={form.control}
					name="parent_id"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Parent Task</FormLabel>
								<Select
									disabled={!isEditable}
									onValueChange={(value) => field.onChange(Number(value))}
									value={field.value ? field.value.toString() : ""}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select a parent task">
												{field.value ? parentTasks()?.find((task) => task.id == field.value)?.title : "Select a task"}
											</SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem className="w-full bg-secondary x-auto" value={0}>
											Clear Selection
										</SelectItem>
										{Array.isArray(tasks) && tasks.length > 0 ? (
											parentTasks()?.map((task) => (
												<SelectItem key={task.id} value={task.id.toString()}>
													<div className="flex flex-col">
														<span> {task.title}</span>
														<span className="text-muted-foreground opacity-50">
															{task.project?.title} | {task.status?.name}
														</span>
													</div>
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
				{showMore || updateData.calendar_add ? (
					<>
						<div className="flex flex-col gap-4 bg-secondary p-4 rounded-lg">
							<div className="flex flex-row items-center justify-start gap-2 w-full font-medium text-base text-muted-foreground">
								<Scale size={20} /> Weight and Effort Estimates
							</div>
							<FormField
								control={form.control}
								name="weight"
								render={({ field }) => {
									return (
										<FormItem className="w-full">
											<FormLabel>Weight</FormLabel>
											<FormControl>
												<Input disabled={!isEditable} type="number" step="any" min={1} max={5} placeholder="Weight" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<div className="flex  justify-between gap-4">
								<FormField
									control={form.control}
									name="effort_estimate"
									render={({ field }) => {
										return (
											<FormItem className="w-full">
												<FormLabel>Effort Estimate</FormLabel>
												<FormControl>
													<Input
														disabled={!isEditable}
														type="number"
														step="any"
														min={1}
														max={100}
														placeholder="Effort estimate"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
								<FormField
									control={form.control}
									name="effort_taken"
									render={({ field }) => {
										return (
											<FormItem className="w-full">
												<FormLabel>Actual Effort</FormLabel>
												<FormControl>
													<Input
														disabled={!isEditable}
														type="number"
														step="any"
														min={1}
														max={100}
														placeholder="Actual effort"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</div>
						</div>
						<div className="flex flex-col gap-4 bg-secondary p-4 rounded-lg">
							<div className="flex flex-row items-center justify-start gap-2 w-full font-medium text-base text-muted-foreground">
								<CalendarDays size={20} /> Date Details
							</div>
							<div className="flex justify-between gap-4">
								<FormField
									control={form.control}
									name="start_date"
									render={({ field }) => {
										return (
											<DateInput
												disabled={!isEditable}
												field={field}
												label={"Start date"}
												placeholder={"Select start date"}
												className="w-full"
											/>
										);
									}}
								/>
								<FormField
									control={form.control}
									name="end_date"
									render={({ field }) => {
										return (
											<DateInput
												disabled={!isEditable}
												field={field}
												label={"End date"}
												placeholder={"Select end date"}
												className="w-full"
											/>
										);
									}}
								/>
							</div>
							<div className="flex  justify-between gap-4">
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
						<div className="flex flex-col gap-4 bg-secondary p-4 rounded-lg">
							<div className="flex flex-row items-center justify-start gap-2 w-full font-medium text-base text-muted-foreground">
								<AlarmClock size={20} /> Time Details
							</div>
							<div className="flex flex-row justify-between gap-4">
								<FormField
									control={form.control}
									name="start_time"
									render={({ field }) => {
										return (
											<FormItem className="w-full">
												<FormLabel>Start Time</FormLabel>
												<FormControl>
													<Input
														disabled={!isEditable}
														type="time"
														step="60"
														inputMode="numeric"
														pattern="[0-9]{2}:[0-9]{2}"
														className="bg-background appearance-none"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
								<FormField
									control={form.control}
									name="end_time"
									render={({ field }) => {
										return (
											<FormItem className="w-full">
												<FormLabel>End Time</FormLabel>
												<FormControl>
													<Input
														disabled={!isEditable}
														type="time"
														step="any"
														// placeholder="Rating &#40;1-10&#41;"
														className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</div>
							<div className="flex flex-row justify-between gap-4">
								<FormField
									control={form.control}
									name="time_estimate"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>
												<div title="Auto calculate time estimate" className="flex flex-row justify-between">
													<span>Time Estimate</span>
													<Sparkles
														size={16}
														className="text-muted-foreground text-xs hover:text-primary hover:cursor-pointer"
														onClick={() => calculateField("time_estimate")}
													/>
												</div>
											</FormLabel>
											<div>
												<div className="flex flex-row justify-between gap-2">
													<div className="flex flex-row gap-2 w-full">
														<Input
															disabled={!isEditable}
															type="number"
															min="0"
															placeholder="hr"
															value={timeEstimateHour}
															onChange={(e) => {
																const val = e.target.value.replace(/[^0-9]/g, "");
																setTimeEstimateHour(val);
																const decimal = parseInt(val || "0", 10) + parseInt(timeEstimateMinute || "0", 10) / 60;
																field.onChange(val || timeEstimateMinute ? Number(decimal.toFixed(2)) : "");
															}}
															className="w-full"
														/>
														{/* <span>hr</span> */}
														<Input
															disabled={!isEditable}
															type="number"
															min="0"
															max="59"
															placeholder="min"
															value={timeEstimateMinute}
															onChange={(e) => {
																let val = e.target.value.replace(/[^0-9]/g, "");
																if (parseInt(val, 10) > 59) val = "59";
																setTimeEstimateMinute(val);
																const decimal = parseInt(timeEstimateHour || "0", 10) + parseInt(val || "0", 10) / 60;
																field.onChange(timeEstimateHour || val ? Number(decimal.toFixed(2)) : "");
															}}
															className="w-full"
														/>
														{/* <span>min</span> */}
													</div>
												</div>
												{autoCalculateErrors.time_estimate !== "" ? (
													<span className="text-destructive">{autoCalculateErrors.time_estimate}</span>
												) : (
													""
												)}
												<FormMessage /> {/* ✅ Now linked to time_estimate */}
											</div>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="actual_time"
									render={({ field }) => {
										return (
											<FormItem className="w-full">
												<FormLabel>
													<div>Actual Time</div>
												</FormLabel>
												<FormControl>
													<Input
														disabled={!isEditable}
														type="time"
														step="any"
														// placeholder="Rating &#40;1-10&#41;"
														className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</div>
							<div className="flex flex-col md:flex-row justify-between gap-4">
								<FormField
									control={form.control}
									name="time_taken"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>
												<div title="Auto calculate time taken" className="flex flex-row justify-between">
													<span>Time Taken</span>
													<Sparkles
														size={16}
														className="text-muted-foreground hover:text-primary hover:cursor-pointer"
														onClick={() => calculateField("time_taken")}
													/>
												</div>
											</FormLabel>
											<div>
												<div className="flex gap-2">
													<Input
														disabled={!isEditable}
														type="number"
														min="0"
														placeholder="hr"
														value={timeTakenHour}
														onChange={(e) => {
															const val = e.target.value.replace(/[^0-9]/g, "");
															setTimeTakenHour(val);
															const decimal = parseInt(val || "0", 10) + parseInt(timeTakenMinute || "0", 10) / 60;
															field.onChange(val || timeTakenMinute ? Number(decimal.toFixed(2)) : "");
														}}
														className="w-full"
													/>
													{/* <span>hr</span> */}
													<Input
														disabled={!isEditable}
														type="number"
														min="0"
														max="59"
														placeholder="min"
														value={timeTakenMinute}
														onChange={(e) => {
															let val = e.target.value.replace(/[^0-9]/g, "");
															if (parseInt(val, 10) > 59) val = "59";
															setTimeTakenMinute(val);
															const decimal = parseInt(val || "0", 10) + parseInt(timeTakenHour || "0", 10) / 60;
															field.onChange(val || timeTakenHour ? Number(decimal.toFixed(2)) : "");
														}}
														className="w-full"
													/>
													{/* <span>min</span> */}
												</div>
												{autoCalculateErrors.time_taken !== "" ? (
													<span className="text-destructive">{autoCalculateErrors.time_taken}</span>
												) : (
													""
												)}
											</div>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormItem className="w-full">
									<FormLabel>
										<div title="Auto calculate time delay" className="flex flex-row justify-between">
											<span>Time Delay</span>
											<Sparkles
												size={16}
												className="text-muted-foreground hover:text-primary hover:cursor-pointer"
												onClick={() => calculateField("delay")}
											/>
										</div>
									</FormLabel>
									<div>
										<div className="flex flex-row justify-between gap-2">
											<div className="flex gap-2 w-full">
												<Input
													disabled={!isEditable}
													type="number"
													min="0"
													placeholder="hr"
													value={delayHour}
													onChange={(e) => {
														const val = e.target.value.replace(/[^0-9]/g, "");
														setDelayHour(val);
													}}
													className="w-full"
												/>
												{/* <span>hr</span> */}
												<Input
													disabled={!isEditable}
													type="number"
													min="0"
													max="59"
													placeholder="min"
													value={delayMinute}
													onChange={(e) => {
														let val = e.target.value.replace(/[^0-9]/g, "");
														if (parseInt(val, 10) > 59) val = "59";
														setDelayMinute(val);
													}}
													className="w-full"
												/>
												{/* <span>min</span> */}
											</div>
										</div>
										{autoCalculateErrors.time_delay !== "" ? (
											<span className="text-destructive">{autoCalculateErrors.time_delay}</span>
										) : (
											""
										)}
									</div>
								</FormItem>
							</div>
						</div>
						<FormField
							control={form.control}
							name="delay_reason"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>Delay reason</FormLabel>
										<FormControl>
											<Textarea disabled={!isEditable} placeholder="Delay reason" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
						{user_auth?.data?.role !== "Employee" && (
							<>
								<FormField
									control={form.control}
									name="performance_rating"
									render={({ field }) => {
										return (
											<FormItem>
												<FormLabel className="flex flex-row items-start gap-2">
													Rating &#40;1-5&#41;
													<span title="1-Very Poor; 2-Below Expectation; 3-Meets Expectations; 4-Above Expectations; 5-Outstanding ">
														<Info size={16} className="text-muted-foreground" />
													</span>
												</FormLabel>
												<FormControl>
													<Input
														disabled={!isEditable}
														type="number"
														min={0}
														max={5}
														step="any"
														placeholder="Rating &#40;1-5&#41;"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
								<FormField
									control={form.control}
									name="remarks"
									render={({ field }) => {
										return (
											<FormItem>
												<FormLabel>Remarks</FormLabel>
												<FormControl>
													<Textarea disabled={!isEditable} placeholder="Remarks" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</>
						)}
					</>
				) : (
					""
				)}
				<div className="w-full" ref={bottomRef}>
					<Button
						type="button"
						variant="secondary"
						className="w-full"
						onClick={() => {
							setShowMore(!showMore);
							scrollToBottom();
						}}
					>
						{!showMore ? "Show other details" : " Hide other details"}
					</Button>
				</div>
				{isEditable ? (
					<div className="flex gap-2 sticky bottom-0 backdrop-blur-sm bg-background/30 backdrop-saturate-150 p-4 mt-auto">
						<Button variant="secondary" type="button" className="w-full" onClick={() => setIsOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={tasksLoading} className="w-full">
							{tasksLoading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />}{" "}
							{Object.keys(updateData).length === 0 || updateData?.calendar_add || updateData?.kanban_add ? "Submit" : "Update"}
						</Button>
					</div>
				) : (
					""
				)}
			</form>
		</Form>
	);
}
