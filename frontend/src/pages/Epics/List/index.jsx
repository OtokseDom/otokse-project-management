import axiosClient from "@/axios.client";
import React, { useEffect, useState } from "react";
import { columnsEpic } from "./columns";
import { useToast } from "@/contexts/ToastContextProvider";
import { DataTableEpics } from "./data-table";
import { API } from "@/constants/api";
import { useEpicsStore } from "@/store/epics/epicsStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useTaskHelpers } from "@/utils/taskHelpers";
import GridList from "./grid/gridList";
import { Button } from "@/components/ui/button";
import { Plus, Rows3, Table } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import EpicForm from "../form";
import { Input } from "@/components/ui/input";
import { useUsersStore } from "@/store/users/usersStore";
import { useEpicHelpers } from "@/utils/epicHelpers";
import { useEpicStore } from "@/store/epic/epicStore";

export default function Epics() {
	const { epics, epicsLoaded, epicsLoading, setEpicsLoading } = useEpicsStore([]);
	const { isOpen, setIsOpen, updateData, setUpdateData } = useEpicStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { users } = useUsersStore();
	const { fetchTaskStatuses, fetchUsers } = useTaskHelpers();
	const { fetchEpics } = useEpicHelpers();

	const [view, setView] = useState(() => "grid");
	const showToast = useToast();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedEpicId, setSelectedEpicId] = useState(null);
	const [hasRelation, setHasRelation] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [searchEpics, setSearchEpics] = useState([]);

	useEffect(() => {
		document.title = "Task Management | Epics";
		if (!taskStatuses || taskStatuses.length === 0) fetchTaskStatuses();
		if (!users || users.length === 0) fetchUsers();
		if ((!epics || epics.length === 0) && !epicsLoaded) fetchEpics();
	}, []);

	const checkHasRelation = async (epic = {}) => {
		setEpicsLoading(true);
		setTimeout(() => {
			setDialogOpen(true);
		}, 100);
		setSelectedEpicId(epic.id);
		try {
			const hasRelationResponse = await axiosClient.post(API().relation_check("epic", epic.id));
			setHasRelation(hasRelationResponse?.data?.data?.exists);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setEpicsLoading(false);
		}
	};
	useEffect(() => {
		if (!dialogOpen) setHasRelation(false);
	}, [dialogOpen]);

	const displayEpics = searchValue.trim() ? searchEpics : epics;
	// Update search results whenever search value or sorted tasks change
	useEffect(() => {
		if (searchValue.trim()) {
			const searchResults = epics.filter((epic) => {
				return epic.title.toLowerCase().includes(searchValue.toLowerCase());
			});
			setSearchEpics(searchResults);
		}
	}, [searchValue]);

	return (
		<div className="w-screen md:w-full bg-card text-card-foreground border border-border rounded-2xl container p-4 md:p-10 shadow-md">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			<div className="flex items-center justify-between">
				<div>
					<h1 className=" font-extrabold text-3xl">Epics</h1>
					<p>View list of all epics</p>
				</div>
				{/* Tabs */}
				<div className="gap-1 ml-4 inline-flex rounded-md bg-muted/5 p-1">
					<Button title="Grid view" variant={view === "grid" ? "" : "ghost"} onClick={() => setView("grid")}>
						<Rows3 size={16} />
					</Button>
					<Button
						title="Table view"
						variant={view === "list" ? "" : "ghost"}
						onClick={() => {
							setView("list");
							setSearchValue("");
						}}
					>
						<Table size={16} />
					</Button>
				</div>
			</div>
			<Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
				{!epicsLoading && (
					<div className={`flex w-full my-4 ${view === "grid" ? "justify-between" : "justify-end"}`}>
						{view === "grid" ? (
							<Input
								placeholder={"Search title ..."}
								value={searchValue}
								onChange={(event) => setSearchValue(event.target.value)}
								className="max-w-sm"
							/>
						) : (
							""
						)}

						<SheetTrigger asChild>
							<Button variant="">
								<Plus />
								Add Epic
							</Button>
						</SheetTrigger>
					</div>
				)}
				<SheetContent side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
					<SheetHeader>
						<SheetTitle>{updateData?.id ? "Update Epic" : "Add Epic"}</SheetTitle>
						<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
					</SheetHeader>
					<EpicForm />
				</SheetContent>
			</Sheet>
			{/* Updated table to fix dialog per column issue */}
			{(() => {
				const { columnsEpic: epicColumns, dialog } = columnsEpic({
					// setIsOpen,
					// setUpdateData,
					dialogOpen,
					setDialogOpen,
					checkHasRelation,
					hasRelation,
					selectedEpicId,
				});
				return (
					<>
						{view === "list" ? (
							<>
								<DataTableEpics
									columns={epicColumns}
									// updateData={updateData}
									// setUpdateData={setUpdateData}
									// isOpen={isOpen}
									// setIsOpen={setIsOpen}
								/>
								{dialog}
							</>
						) : (
							<>
								{displayEpics.length > 0 ? (
									<GridList
										epics={displayEpics}
										checkHasRelation={checkHasRelation}
										dialogOpen={dialogOpen}
										setDialogOpen={setDialogOpen}
										hasRelation={hasRelation}
										// context={context}
										// contextId={contextId}
									/>
								) : (
									<div className="text-center text-muted-foreground py-8">No epics found matching "{searchValue}"</div>
								)}
								{dialog}
							</>
						)}
					</>
				);
			})()}
		</div>
	);
}
