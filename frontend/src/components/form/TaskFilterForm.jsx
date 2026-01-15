"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import DateInput from "@/components/form/DateInput";
import { useEffect, useState } from "react";
import { MultiSelect } from "@/components/ui/multi-select";
import { useTasksStore } from "@/store/tasks/tasksStore";

const formSchema = z
	.object({
		from: z.date().optional(),
		to: z.date().optional(),
	})
	.refine(
		(data) => {
			const hasFrom = !!data.from;
			const hasTo = !!data.to;
			// Only enforce both dates if at least one is provided
			if (hasFrom || hasTo) {
				return hasFrom && hasTo;
			}
			return true;
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

export default function TaskFilterForm({ setIsOpen, users = [], showUserFilter = true }) {
	const { taskFilters, setTaskDateRange, setTaskSelectedUsers, clearTaskFilters } = useTasksStore();
	const [selectedUsers, setSelectedUsers] = useState(taskFilters.selectedUsers);

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			from: taskFilters.dateRange.from ?? undefined,
			to: taskFilters.dateRange.to ?? undefined,
		},
	});

	useEffect(() => {
		form.reset({
			from: taskFilters.dateRange.from ?? undefined,
			to: taskFilters.dateRange.to ?? undefined,
		});
		setSelectedUsers(taskFilters.selectedUsers);
	}, [taskFilters, form]);

	const handleClearAllFilters = () => {
		clearTaskFilters();
		form.reset({
			from: undefined,
			to: undefined,
		});
		setSelectedUsers([]);
		setIsOpen(false);
	};

	const handleSubmit = (formData) => {
		const from = formData?.from ? new Date(formData.from) : null;
		const to = formData?.to ? new Date(formData.to) : null;

		setTaskDateRange(from, to);
		setTaskSelectedUsers(selectedUsers);
		setIsOpen(false);
	};

	const isFormDirty = form.watch("from") || form.watch("to") || selectedUsers?.length > 0;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 max-w-md w-full">
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

				{showUserFilter && users?.length > 0 && (
					<FormItem>
						<FormLabel>Assignees</FormLabel>
						<FormControl>
							<MultiSelect
								options={users.map((u) => ({
									label: u.name,
									value: String(u.id),
								}))}
								onValueChange={(values) => setSelectedUsers(values.map((v) => parseInt(v)))}
								defaultValue={selectedUsers.map((u) => String(u))}
								placeholder="Select assignees"
								variant="inverted"
								animation={2}
								maxCount={3}
							/>
						</FormControl>
					</FormItem>
				)}

				<div className="flex gap-2 justify-center items-center">
					{isFormDirty && (
						<Button type="button" className="w-full" variant="ghost" onClick={handleClearAllFilters}>
							Clear All Filters
						</Button>
					)}
					<Button type="submit" disabled={!isFormDirty} className="w-full" variant="default">
						Apply Filter
					</Button>
				</div>
			</form>
		</Form>
	);
}
