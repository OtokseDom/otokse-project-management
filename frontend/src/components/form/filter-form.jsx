"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import axiosClient from "@/axios.client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContextProvider";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import DateInput from "@/components/form/DateInput";
import { useEffect } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { API } from "@/constants/api";

const formSchema = z
	.object({
		from: z.date().optional(),
		to: z.date().optional(),
	})
	.refine(
		(data) => {
			const hasFrom = !!data.from;
			const hasTo = !!data.to;
			return (hasFrom && hasTo) || (!hasFrom && !hasTo);
		},
		{
			message: "Both 'From' and 'To' dates are required if one is provided.",
			path: ["from"],
		}
	)
	.refine(
		(data) => {
			if (data.from && data.to) {
				return data.from <= data.to;
			}
			return true;
		},
		{
			message: "'From' date must be earlier or equal to 'To' date.",
			path: ["from"],
		}
	);

export default function FilterForm({
	setIsOpen,
	userId = null,
	setReports,
	filters,
	setFilters,
	// Users
	users,
	selectedUsers,
	setSelectedUsers,
	// Projects
	projects,
	selectedProjects,
	setSelectedProjects,
	// Epics
	epics,
	selectedEpics,
	setSelectedEpics,
}) {
	const { loading, setLoading } = useLoadContext();
	const showToast = useToast();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			from: undefined,
			to: undefined,
		},
	});

	useEffect(() => {
		// Populating form when has active filter values
		if (filters.values) {
			const fromStr = filters.values["Date Range"]?.split(" to ")[0] || undefined;
			const toStr = filters.values["Date Range"]?.split(" to ")[1] || undefined;
			const from = fromStr ? new Date(fromStr) : undefined;
			const to = fromStr ? new Date(toStr) : undefined;
			// const project_id = filters.values["Project"];
			// Epics
			const epicsRaw = filters.values["Epics"];
			const epicIds = Array.isArray(epicsRaw)
				? epicsRaw.map((id) => parseInt(id))
				: typeof epicsRaw === "string"
				? epicsRaw
						?.split(",")
						.map((id) => parseInt(id.trim()))
						.filter((id) => !isNaN(id)) // to avoid [NaN] when epicsRaw is empty or non numeric
				: [];
			setSelectedEpics(epicIds); // crucial
			// Projects
			const projectsRaw = filters.values["Projects"];
			const projectIds = Array.isArray(projectsRaw)
				? projectsRaw.map((id) => parseInt(id))
				: typeof projectsRaw === "string"
				? projectsRaw
						?.split(",")
						.map((id) => parseInt(id.trim()))
						.filter((id) => !isNaN(id)) // to avoid [NaN] when projectsRaw is empty or non numeric
				: [];
			setSelectedProjects(projectIds); // crucial
			// Users
			if (!userId) {
				const membersRaw = filters.values["Members"];
				const userIds = Array.isArray(membersRaw)
					? membersRaw.map((id) => parseInt(id))
					: typeof membersRaw === "string"
					? membersRaw
							?.split(",")
							.map((id) => parseInt(id.trim()))
							.filter((id) => !isNaN(id)) // to avoid [NaN] when membersRaw is empty or non numeric
					: [];
				setSelectedUsers(userIds); // crucial
			}
			form.reset({
				from: from ?? undefined,
				to: to ?? undefined,
			});
		}
	}, [filters, form]);

	const handleClearAllFilters = async () => {
		// Close the modal
		setIsOpen(false);

		// Reset form fields
		form.reset({
			from: undefined,
			to: undefined,
			selected_epics: [],
			selected_projects: [],
			selected_users: selectedUsers ? [] : undefined, // only reset if exists
		});

		// Reset MultiSelect state
		setSelectedProjects([]);
		if (setSelectedUsers) setSelectedUsers([]);

		// Clear filter tags
		const updatedFilters = {
			values: {
				"Date Range": null,
				Projects: [],
				Epics: [],
			},
			display: {
				"Date Range": null,
				Members: selectedUsers ? [] : undefined, // only if users exist
				Projects: [],
				Epics: [],
			},
		};
		setFilters(updatedFilters);

		// Fetch all unfiltered reports
		setLoading(true);
		try {
			let reportsRes = "";
			if (!userId) {
				reportsRes = await axiosClient.get(API().dashboard("", "", "", ""));
			} else {
				reportsRes = await axiosClient.get(API().user_reports(userId, "", "", ""));
			}
			setReports(reportsRes.data.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (form_filter) => {
		setLoading(true);
		try {
			const from = form_filter?.from ? form_filter.from.toLocaleDateString("en-CA") : "";
			const to = form_filter?.to ? form_filter.to.toLocaleDateString("en-CA") : "";
			// Epics
			const selected_epics = form_filter?.selected_epics || []; // this only gets the IDs of selected epics
			const selectedEpicObjects = epics?.filter((p) => selected_epics.includes(p.value)); // this maps the IDs to epic objects
			// Projects
			const selected_projects = form_filter?.selected_projects || []; // this only gets the IDs of selected projects
			const selectedProjectObjects = projects?.filter((p) => selected_projects.includes(p.value)); // this maps the IDs to project objects
			// Users
			const selected_users = form_filter?.selected_users || []; // this only gets the IDs of selected users
			const selectedUserObjects = users?.filter((u) => selected_users.includes(u.value)); // this maps the IDs to user objects
			let filteredReports;
			if (!userId) {
				filteredReports = await axiosClient.get(
					API().dashboard(from, to, selected_users.join(","), selected_projects.join(","), selected_epics.join(","))
				);
				setFilters({
					values: {
						"Date Range": `${from && to ? from + " to " + to : ""}`,
						Members: selectedUserObjects?.map((u) => u.value).join(", ") || "",
						Projects: selectedProjectObjects?.map((p) => p.value).join(", ") || "",
						Epics: selectedEpicObjects?.map((p) => p.value).join(", ") || "",
					},
					display: {
						"Date Range": `${from && to ? from + " to " + to : ""}`,
						Members: selectedUserObjects?.map((u) => u.label).join(", ") || "",
						Projects: selectedProjectObjects?.map((p) => p.label).join(", ") || "",
						Epics: selectedEpicObjects?.map((p) => p.label).join(", ") || "",
					},
				});
			} else {
				filteredReports = await axiosClient.get(API().user_reports(userId, from, to, selected_projects.join(","), selected_epics.join(",")));
				setFilters({
					values: {
						"Date Range": `${from && to ? from + " to " + to : ""}`,
						Projects: selectedProjectObjects?.map((p) => p.value).join(", ") || "",
						Epics: selectedEpicObjects?.map((p) => p.value).join(", ") || "",
					},
					display: {
						"Date Range": `${from && to ? from + " to " + to : ""}`,
						Projects: selectedProjectObjects?.map((p) => p.label).join(", ") || "",
						Epics: selectedEpicObjects?.map((p) => p.label).join(", ") || "",
					},
				});
			}
			setReports(filteredReports.data.data);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			console.error("Error fetching data:", e);
		} finally {
			setLoading(false);
			setIsOpen(false);
		}
	};
	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit((form_filter) => {
					// Include selectedUsers in the filter object
					handleSubmit({ ...form_filter, selected_users: selectedUsers, selected_projects: selectedProjects, selected_epics: selectedEpics });
				})}
				className="flex flex-col gap-4 max-w-md w-full"
			>
				<div className="flex flex-row justify-between gap-4">
					<FormField
						control={form.control}
						name="from"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormControl>
									<DateInput field={field} label={"From"} placeholder={"Select date"} />
								</FormControl>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="to"
						render={({ field }) => (
							<FormItem className="w-full">
								<FormControl>
									<DateInput field={field} label={"To"} placeholder={"Select date"} />
								</FormControl>
							</FormItem>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name="selected_epics"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Epics</FormLabel>
								<FormControl>
									<MultiSelect
										field={field}
										options={epics || []}
										onValueChange={setSelectedEpics}
										defaultValue={selectedEpics}
										placeholder="Select epics"
										variant="inverted"
										animation={2}
										maxCount={3}
									/>
								</FormControl>
							</FormItem>
						);
					}}
				/>
				<FormField
					control={form.control}
					name="selected_projects"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Projects</FormLabel>
								<FormControl>
									<MultiSelect
										field={field}
										options={projects || []}
										onValueChange={setSelectedProjects}
										defaultValue={selectedProjects}
										placeholder="Select projects"
										variant="inverted"
										animation={2}
										maxCount={3}
									/>
								</FormControl>
							</FormItem>
						);
					}}
				/>
				{!userId && (
					<FormField
						control={form.control}
						name="selected_users"
						render={({ field }) => {
							return (
								<FormItem>
									<FormLabel>Members</FormLabel>
									<FormControl>
										<MultiSelect
											field={field}
											options={users || []}
											onValueChange={setSelectedUsers}
											defaultValue={selectedUsers}
											placeholder="Select users"
											variant="inverted"
											animation={2}
											maxCount={3}
										/>
									</FormControl>
								</FormItem>
							);
						}}
					/>
				)}
				<div className="flex gap-2 justify-center items-center">
					{(form.watch("from") ||
						form.watch("to") ||
						(selectedEpics && selectedEpics.length > 0) ||
						(selectedProjects && selectedProjects.length > 0) ||
						(selectedUsers && selectedUsers.length > 0)) && (
						<Button type="button" className="w-full" variant="ghost" onClick={handleClearAllFilters}>
							Clear All Filters
						</Button>
					)}
					<Button
						type="submit"
						disabled={
							loading ||
							((!form.watch("from") || !form.watch("to")) &&
								(selectedUsers?.length === 0 || !selectedUsers) &&
								(selectedProjects?.length === 0 || !selectedProjects) &&
								(selectedEpics?.length === 0 || !selectedEpics))
						}
						className="w-full"
						variant="default"
					>
						{loading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />} Apply Filter
					</Button>
				</div>
			</form>
		</Form>
	);
}
