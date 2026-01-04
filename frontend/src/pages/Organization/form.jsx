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
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { API } from "@/constants/api";
import { useOrganizationStore } from "@/store/organization/organizationStore";

const formSchema = z.object({
	name: z.string().refine((data) => data.trim() !== "", {
		message: "Name is required.",
	}),
	description: z.string().optional(),
});

export default function OrganizationForm({ setIsOpen }) {
	const { user, setUser } = useAuthContext();
	const { loading, setLoading } = useLoadContext();
	const showToast = useToast();
	const { setOrganization } = useOrganizationStore();
	const orgId = user?.data?.organization_id;
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: user?.data?.organization?.name,
			description: user?.data?.organization?.description,
		},
	});

	const handleSubmit = async (form) => {
		setLoading(true);
		try {
			if (orgId) {
				const response = await axiosClient.put(API().organization(orgId), form);
				const updatedOrg = response.data.data;
				// Update only organization.name and organization.description
				setUser((prev) => ({
					...prev,
					data: {
						...prev.data,
						organization: {
							...prev.data.organization,
							name: updatedOrg.name,
							description: updatedOrg.description,
						},
					},
				}));
				setOrganization(updatedOrg);
				showToast("Success!", "Organization updated.", 3000);
			}
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
			<form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4 max-w-md w-full">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => {
						return (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input placeholder="Organization name" {...field} />
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
					<Button type="submit" disabled={loading} className="w-full">
						{loading && <Loader2 className="animate-spin mr-5 -ml-11 text-background" />} Update
					</Button>
				</div>
			</form>
		</Form>
	);
}
