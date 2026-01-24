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
import { Info, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContextProvider";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { API } from "@/constants/api";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useDelayReasonsStore } from "@/store/delayReasons/delayReasonsStore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
	name: z.string().refine((data) => data.trim() !== "", {
		message: "Name is required.",
	}),
	category: z.string().refine((data) => data.trim() !== "", {
		message: "Category is required.",
	}),
	impact_level: z.string().refine((data) => data.trim() !== "", {
		message: "Impact level is required.",
	}),
	severity: z.coerce.number().min(1, { message: "Severity must be between 1 and 5." }).max(5, { message: "Severity must be between 1 and 5." }),
	description: z.string().optional(),
	is_valid: z.boolean().optional(),
	is_active: z.boolean().optional(),
});

export default function DelayReasonForm({ setIsOpen, updateData = {}, setUpdateData }) {
	const { user } = useAuthContext();
	const { delayReasons: data, setDelayReasons, updateDelayReason, addDelayReason, delayReasonsLoading, setDelayReasonsLoading } = useDelayReasonsStore();
	const { fetchTasks } = useTaskHelpers();
	const showToast = useToast();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			category: "scope",
			impact_level: "negative",
			severity: 3,
			is_valid: false,
			description: "",
			is_active: true,
		},
	});

	useEffect(() => {
		if (updateData && Object.keys(updateData).length > 0) {
			const { name, code, category, impact_level, severity, is_valid, description, is_active } = updateData;
			form.reset({
				name: name ?? "",
				category: category ?? "scope",
				impact_level: impact_level ?? "negative",
				severity: severity ?? 3,
				is_valid: typeof is_valid === "boolean" ? is_valid : false,
				description: description ?? "",
				is_active: typeof is_active === "boolean" ? is_active : true,
			});
		}
	}, [updateData, form]);

	const handleSubmit = async (values) => {
		const payload = { ...values, organization_id: user?.data?.organization_id };
		setDelayReasonsLoading(true);
		try {
			if (!updateData || Object.keys(updateData).length === 0) {
				const delayReasonResponse = await axiosClient.post(API().delay_reason(), payload);
				addDelayReason(delayReasonResponse.data.data);
				showToast("Success!", "Delay Reason added.", 3000);
			} else {
				const res = await axiosClient.put(API().delay_reason(updateData.id), payload);
				updateDelayReason(updateData.id, res.data.data || payload);
				showToast("Success!", "Delay Reason updated.", 3000);
			}
		} catch (e) {
			showToast("Failed!", e.response?.data?.message || "An error occurred.", 3000, "fail");
			console.error("Error fetching data:", e);
		} finally {
			if (typeof setUpdateData === "function") setUpdateData({});
			fetchTasks();
			setDelayReasonsLoading(false);
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
									<Input placeholder="Delay reason name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				{/* scope, dependency, planning, external, resource, strategy, quality */}
				<FormField
					control={form.control}
					name="category"
					render={({ field }) => {
						const categories = [
							{ id: "scope", name: "Scope" },
							{ id: "dependency", name: "Dependency" },
							{ id: "external", name: "External" },
							{ id: "planning", name: "Planning" },
							{ id: "resource", name: "Resource" },
							{ id: "strategy", name: "Strategy" },
							{ id: "quality", name: "Quality" },
						];
						return (
							<FormItem className="w-full">
								<FormLabel>Category</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select category"></SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(categories) && categories.length > 0 ? (
											categories.map((category) => (
												<SelectItem key={category.id} value={category.id}>
													{category.name}
												</SelectItem>
											))
										) : (
											<SelectItem disabled>No category available</SelectItem>
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
					name="impact_level"
					render={({ field }) => {
						const levels = [
							{ id: "positive", name: "Positive" },
							{ id: "neutral", name: "Neutral" },
							{ id: "negative", name: "Negative" },
						];
						return (
							<FormItem className="w-full">
								<FormLabel>Impact Level</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select impact level"></SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(levels) && levels.length > 0 ? (
											levels.map((level) => (
												<SelectItem key={level.id} value={level.id}>
													{level.name}
												</SelectItem>
											))
										) : (
											<SelectItem disabled>No impact level available</SelectItem>
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
					name="severity"
					render={({ field }) => {
						const levels = [
							{ id: "1", name: "Trivial" },
							{ id: "2", name: "Minor" },
							{ id: "3", name: "Moderate" },
							{ id: "4", name: "Major" },
							{ id: "5", name: "Critical" },
						];
						return (
							<FormItem className="w-full">
								<FormLabel>Severity</FormLabel>
								<Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="Select severity"></SelectValue>
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{Array.isArray(levels) && levels.length > 0 ? (
											levels.map((level) => (
												<SelectItem key={level.id} value={level.id}>
													{level.name}
												</SelectItem>
											))
										) : (
											<SelectItem disabled>No seveirity available</SelectItem>
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
					name="is_valid"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel className="flex flex-row items-start gap-2">Reason Validity</FormLabel>
								<FormControl>
									<div className="flex items-center gap-3">
										<Switch variant="outline" checked={field.value} onCheckedChange={field.onChange} id="is_valid" />
										<Label htmlFor="is_valid" className="text-sm">
											{field.value ? "Valid" : "Invalid"}
										</Label>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<FormField
					control={form.control}
					name="is_active"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel className="flex flex-row items-start gap-2">Status</FormLabel>
								<FormControl>
									<div className="flex items-center gap-3">
										<Switch variant="outline" checked={field.value} onCheckedChange={field.onChange} id="is_active" />
										<Label htmlFor="is_active" className="text-sm">
											{field.value ? "Active" : "Inactive"}
										</Label>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						);
					}}
				/>
				<div className="flex gap-2 w-full">
					<Button variant="secondary" type="button" className="w-full" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={delayReasonsLoading} className="w-full">
						{delayReasonsLoading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />}{" "}
						{Object.keys(updateData).length === 0 ? "Submit" : "Update"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
