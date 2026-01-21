"use client";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { useEffect, useState } from "react";
import axiosClient from "@/axios.client";

import GalaxyProfileBanner from "../../components/design/galaxy";
// Shadcn UI
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { Building, EllipsisVertical, Eye, EyeOff } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import OrganizationForm from "./form";
import { API } from "@/constants/api";
import { useOrganizationStore } from "@/store/organization/organizationStore";

export default function Organization() {
	const { user } = useAuthContext(); // Get authenticated user details
	const { loading, setLoading } = useLoadContext();
	const { organization, setOrganization } = useOrganizationStore();
	const [isOpen, setIsOpen] = useState(false);
	const [showCode, setShowCode] = useState(false);
	const orgId = user?.data?.organization_id;

	useEffect(() => {
		document.title = "Task Management | Organization";
		if (!organization.id) fetchData();
	}, [user?.data?.organization_id]);

	const fetchData = async () => {
		setLoading(true);
		try {
			if (orgId) {
				const organizationResponse = await axiosClient.get(API().organization(orgId));
				setOrganization(organizationResponse?.data?.data);
			}
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setLoading(false);
		}
	};

	const generateCode = async () => {
		setLoading(true);
		try {
			if (orgId) {
				const { data } = await axiosClient.patch(API().organization_generate_code(orgId));
				setOrganization(data.data); // Assuming Laravel resource response
			}
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error generating code:", e.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={"flex flex-row items-center h-screen w-screen md:w-[800px] container p-5 md:p-0 sm:text-sm -mt-10"}>
			<div
				className={`fixed inset-0 bg-black bg-opacity-60  z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			<GalaxyProfileBanner>
				<div className="absolute inset-0 flex flex-col justify-center items-start p-6 bg-gradient-to-r from-black/50 to-transparent">
					<div className="flex flex-col gap-3 w-full">
						{loading ? (
							<div className="flex gap-5">
								<Skeleton className="w-24 h-24 rounded-full" />
								<div className="flex flex-col gap-2">
									<Skeleton className="w-60 h-10 rounded-full" />
									<Skeleton className="w-60 h-10 rounded-full" />
								</div>
							</div>
						) : (
							<div className="flex items-start justify-between w-full">
								<div className="flex gap-5 items-center">
									<div>
										<Building size={64} />
									</div>
									<div className="w-full">
										<span className="flex gap-3 text-2xl md:text-3xl  font-bold text-white mb-0 md:mb-2">{organization?.name}</span>
										<span className="text-xs md:text-lg text-purple-200">{organization?.description}</span>
									</div>
								</div>
								{user?.data?.role === "Superadmin" || user?.data?.role === "Admin" ? (
									<Dialog>
										<DropdownMenu modal={false}>
											<DropdownMenuTrigger asChild>
												<Button variant="secondary" className="flex items-center">
													<EllipsisVertical size={20} />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem className="cursor-pointer" onClick={() => setIsOpen(true)}>
													Update Organization
												</DropdownMenuItem>
												<DropdownMenuItem className="cursor-pointer" onClick={() => generateCode()}>
													Generate New Code
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</Dialog>
								) : (
									""
								)}
							</div>
						)}
						{/* Code */}
						{loading ? (
							<div className="flex gap-5">
								<Skeleton className="w-24 h-8 rounded-full" />
							</div>
						) : user?.data?.role !== "Employee" ? (
							<div className="flex items-center flex-wrap mt-4 gap-2 md:gap-4 text-lg">
								<span>Code: {showCode ? organization?.code : "•".repeat(organization?.code?.length || 10)}</span>
								<button
									type="button"
									onClick={() => setShowCode((prev) => !prev)}
									className="text-muted-foreground hover:text-foreground transition"
								>
									{showCode ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						) : (
							""
						)}
					</div>
				</div>

				<Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
					{/* <SheetTrigger asChild>
							<Button variant="">Update Organization</Button>
						</SheetTrigger> */}
					<SheetContent side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
						<SheetHeader>
							<SheetTitle>Update Organization</SheetTitle>
							<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
						</SheetHeader>
						<OrganizationForm setIsOpen={setIsOpen} />
					</SheetContent>
				</Sheet>
			</GalaxyProfileBanner>
		</div>
	);
}
