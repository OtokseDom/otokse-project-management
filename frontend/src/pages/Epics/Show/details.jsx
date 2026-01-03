"use client";
import { CalendarDaysIcon, Edit, Flag, Trash2, User } from "lucide-react";
import { Skeleton } from "../../../components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEpicStore } from "@/store/epic/epicStore";
import { priorityColors, statusColors } from "@/utils/taskHelpers";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useEpicHelpers } from "@/utils/epicHelpers";
import EpicForm from "../form";
import DeleteDialog from "../List/deleteDialog";

export default function EpicDetails() {
	const { epic, epicLoading, isOpen, setIsOpen, updateData, dialogOpen, setDialogOpen, hasRelation, selectedEpicId } = useEpicStore();
	const { checkHasRelation, handleUpdateEpic } = useEpicHelpers();

	return (
		<div className="w-screen md:w-full px-2 md:px-0">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			{/* Epic Details */}
			<div className="w-full bg-card text-card-foreground border border-border rounded-2xl p-4 md:p-10 shadow-md">
				{/* <div className="flex w-full font-bold text-lg mb-4">Details</div> */}
				{epicLoading ? (
					<>
						<div className="flex flex-col gap-2 col-span-12 mb-2">
							<Skeleton className="w-full h-8 rounded-lg" />
						</div>
						<div className="w-full grid grid-cols-2 md:grid-cols-12 gap-2">
							{Array.from({ length: 4 }).map((_, index) => (
								<div key={index} className="col-span-1 md:col-span-3 flex flex-col w-full gap-2">
									{/* <Skeleton className="w-full h-4 rounded-full" /> */}
									<span className="text-muted-foreground font-bold">
										{index === 0 ? "Status" : index === 1 ? "Priority" : index === 2 ? "Owner" : "Slug"}
									</span>
									<Skeleton className="w-full h-6 rounded-full" />
								</div>
							))}
						</div>
						<hr className="w-full my-4 h-1" />
						<div className="w-full grid grid-cols-2 md:grid-cols-12 gap-2">
							{Array.from({ length: 3 }).map((_, index) => (
								<div
									key={index}
									className={`${index === 2 ? "col-span-2 md:col-span-6" : "col-span-1 md:col-span-3"} flex flex-col w-full gap-2`}
								>
									<span className="text-muted-foreground font-bold">{index === 0 ? "Start Date" : index === 1 ? "End Date" : "Remarks"}</span>
									<Skeleton className="w-full h-4 rounded-full" />
								</div>
							))}
						</div>
					</>
				) : (
					<>
						{/* Actions */}
						<div className="flex w-full justify-end">
							<Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
								<SheetContent side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
									<SheetHeader>
										<SheetTitle>{updateData?.id ? "Update Epic" : "Add Epic"}</SheetTitle>
										<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
									</SheetHeader>
									<EpicForm />
								</SheetContent>
							</Sheet>
							<Button variant="ghost" size="sm" title="Edit" onClick={() => handleUpdateEpic(epic)}>
								<Edit size={12} />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								title="Delete"
								onClick={() => {
									checkHasRelation(epic);
								}}
							>
								<Trash2 size={12} className="text-destructive" />
							</Button>
						</div>
						<div className="w-full mb-4">
							<span className="text-muted-foreground font-bold">Description</span>
							<div className="mb-4">{epic?.description}</div>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-12 justify-evenly mb-4 gap-2">
							<div className="col-span-1 md:col-span-6 flex flex-col items-start gap-1">
								<span className="text-muted-foreground font-bold">Status</span>
								<span className={`px-2 py-1 w-fit text-center rounded-2xl text-xs ${statusColors[epic?.status?.color?.toLowerCase()] || ""}`}>
									{epic?.status?.name}
								</span>
							</div>
							<div className="col-span-1 md:col-span-6 flex flex-col items-start gap-1">
								<span className="text-muted-foreground font-bold">Priority</span>
								<span
									className={`px-2 py-1 w-fit text-center rounded text-xs ${priorityColors[epic?.priority] || "bg-gray-200 text-gray-800"}`}
								>
									{epic?.priority?.replace("_", " ")}
								</span>
							</div>
						</div>
						<div className="grid grid-cols-2 md:grid-cols-12 justify-evenly mb-4 gap-2">
							<div className="col-span-1 md:col-span-6 flex flex-col items-start gap-1">
								<span className="text-muted-foreground font-bold">Owner</span>
								{epic.owner_id && (
									<span
										title="View Profile"
										className="flex justify-center items-center px-2 py-1 rounded-full bg-background/50 border-2 border-foreground/50 text-foreground text-xs gap-2 hover:cursor-pointer"
									>
										<User size={16} /> {epic.owner.name}
									</span>
								)}
							</div>
							<div className="col-span-1 md:col-span-6 flex flex-col items-start gap-1">
								<span className="text-muted-foreground font-bold">Slug</span>
								<span>{epic?.slug}</span>
							</div>
						</div>
						<hr className="w-full my-4 h-1" />
						<div className="w-full grid grid-cols-2 auto-rows-auto gap-2 mb-4">
							<div className=" col-span-1 flex flex-col items-start gap-1">
								<span className="text-muted-foreground font-bold">Start Date</span>
								<div className="flex gap-1">
									<CalendarDaysIcon size={16} />
									<span className="text-card-foreground">{epic?.start_date ? format(new Date(epic.start_date), "MMM-dd yyyy") : "--"}</span>
								</div>
							</div>
							<div className=" col-span-1 flex flex-col items-start gap-1">
								<span className="text-muted-foreground font-bold">End Date</span>
								<div className="flex gap-1">
									<CalendarDaysIcon size={16} />
									<span className="text-card-foreground">{epic?.end_date ? format(new Date(epic.end_date), "MMM-dd yyyy") : "--"}</span>
								</div>
							</div>
						</div>
						<div className="w-full grid grid-cols-1 auto-rows-auto gap-2">
							<div className="col-span-1 flex flex-col items-start gap-1">
								<span className="text-muted-foreground font-bold">Remarks</span>
								<span>{epic?.remarks}</span>
							</div>
						</div>
					</>
				)}
			</div>
			<DeleteDialog dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} hasRelation={hasRelation} selectedEpicId={selectedEpicId} />
		</div>
	);
}
