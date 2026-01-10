import { useParams } from "react-router-dom";
import { Flag } from "lucide-react";
import { useEffect, useRef } from "react";
import { useEpicHelpers } from "@/utils/epicHelpers";
import { useEpicStore } from "@/store/epic/epicStore";
import { Skeleton } from "@/components/ui/skeleton";
import Tasks from "@/pages/Tasks/List";
import EpicDetails from "./details";
import { useEpicsStore } from "@/store/epics/epicsStore";
import Projects from "@/pages/Projects/List";
import { useScrollStore } from "@/store/scroll/scrollStore";

export default function Epic() {
	const { id } = useParams();
	const { epic, epicLoading } = useEpicStore();
	const { setSelectedEpic } = useEpicsStore();
	const { fetchEpic } = useEpicHelpers();
	const targetRef = useRef(null);
	const { setScrollToTarget } = useScrollStore();

	useEffect(() => {
		// Register scroll function once
		setScrollToTarget(() => {
			targetRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		});
	}, [setScrollToTarget]);

	// Fetch user details and reports when ID changes
	useEffect(() => {
		document.title = "Task Management | Epic";
		if (Object.keys(epic).length === 0 || parseInt(epic.id) !== parseInt(id)) fetchEpic(id);
		setSelectedEpic(Number(id));
		// if (!epicReports || epicReports.length === 0 || epic.id != parseInt(id)) fetchEpicReports(id);
	}, [id]);

	return (
		<div className="flex flex-col w-screen md:w-full items-center justify-center ">
			{/* <div
				className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen || isOpenUser || isOpenFilter || dialogOpen || deleteDialogOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/> */}

			{/* Update user Form Sheet */}
			{/* <Sheet open={isOpenUser} onOpenChange={setIsOpenUser} modal={false}>
				<SheetContent side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
					<SheetHeader>
						<SheetTitle>Update User</SheetTitle>
						<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
					</SheetHeader>
					<UserForm setIsOpen={setIsOpenUser} updateData={user} userProfileId={id} />
				</SheetContent>
			</Sheet> */}

			{/* Main Content Grid */}
			<div className="w-full grid grid-cols-1 md:grid-cols-12 items-center justify-center gap-2 md:gap-4 auto-rows-auto mt-4">
				{/* Epic title */}
				{epicLoading ? (
					<div className="flex gap-2 col-span-12">
						<Skeleton className="w-12 h-12 rounded-full" />
						<Skeleton className="w-full md:w-1/2 h-12 rounded-full" />
					</div>
				) : (
					<div className="col-span-12 mb-4 mx-4">
						<h1 className="flex items-start md:items-center gap-4 font-bold text-3xl">
							<Flag className="hidden md:block" size={24} /> {epic?.title || "N/A"}
						</h1>
						{/* <p>View list of all epics</p> */}
					</div>
				)}
				<div className="grid grid-cols-1 md:grid-cols-12 col-span-12 gap-2 md:gap-4">
					<div className="order-2 md:order-1 col-span-1 md:col-span-8 h-fit max-h-full">
						<Projects />
					</div>
					<div className="order-1 md:order-2 col-span-1 md:col-span-4">
						<EpicDetails />
					</div>
				</div>
				<div ref={targetRef} className="col-span-12 h-fit max-h-full">
					<Tasks />
				</div>
			</div>
		</div>
	);
}
