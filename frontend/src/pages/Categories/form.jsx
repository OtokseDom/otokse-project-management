"use client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axiosClient from "@/axios.client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContextProvider";
import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { API } from "@/constants/api";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useTaskHelpers } from "@/utils/taskHelpers";

const formSchema = z.object({
	name: z.string().refine((data) => data.trim() !== "", {
		message: "Name is required.",
	}),
	description: z.string().refine((data) => data.trim() !== "", {
		message: "Description is required.",
	}),
});

export default function CategoryForm({ setIsOpen, updateData, setUpdateData }) {
	const { user } = useAuthContext();
	const { categories: data, setCategories, updateCategory, addCategory, categoriesLoading, setCategoriesLoading } = useCategoriesStore();
	const { fetchTasks } = useTaskHelpers();
	const showToast = useToast();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
		},
	});

	useEffect(() => {
		if (updateData) {
			const { name, description } = updateData;
			form.reset({
				name,
				description,
			});
		}
	}, [updateData, form]);

	const handleSubmit = async (form) => {
		form.organization_id = user.data.organization_id;
		setCategoriesLoading(true);
		try {
			if (Object.keys(updateData).length === 0) {
				const categoryResponse = await axiosClient.post(API().category(), form);
				addCategory(categoryResponse.data.data);
				showToast("Success!", "Category added.", 3000);
			} else {
				await axiosClient.put(API().category(updateData?.id), form);
				updateCategory(updateData.id, form);
				showToast("Success!", "Category updated.", 3000);
			}
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			console.error("Error fetching data:", e);
		} finally {
			setUpdateData({});
			fetchTasks();
			setCategoriesLoading(false);
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
									<Input placeholder="Category name" {...field} />
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
				<div className="flex gap-2 w-full">
					<Button variant="secondary" type="button" className="w-full" onClick={() => setIsOpen(false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={categoriesLoading} className="w-full">
						{categoriesLoading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />}{" "}
						{Object.keys(updateData).length === 0 ? "Submit" : "Update"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
