import axiosClient from "@/axios.client";
import React, { useEffect, useState } from "react";
import { columnsProject } from "./columns";
import { useToast } from "@/contexts/ToastContextProvider";
import { DataTableProjects } from "./data-table";
import { API } from "@/constants/api";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useTaskHelpers } from "@/utils/taskHelpers";
import GridList from "./grid/gridList";
import { Button } from "@/components/ui/button";
import { Plus, Rows3, Table } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ProjectForm from "../form";
import { Input } from "@/components/ui/input";

export default function Projects() {
	const { projects, projectsLoaded, projectsLoading, setProjectsLoading } = useProjectsStore([]);
	const { taskStatuses } = useTaskStatusesStore();
	const { fetchProjects, fetchTaskStatuses } = useTaskHelpers();

	const [view, setView] = useState(() => "grid");
	const showToast = useToast();
	const [isOpen, setIsOpen] = useState(false);
	const [updateData, setUpdateData] = useState({});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedProjectId, setSelectedProjectId] = useState(null);
	const [hasRelation, setHasRelation] = useState(false);
	const [searchValue, setSearchValue] = useState("");
	const [searchProjects, setSearchProjects] = useState([]);

	useEffect(() => {
		if (!isOpen) setUpdateData({});
	}, [isOpen]);
	useEffect(() => {
		document.title = "Task Management | Projects";
		if (!taskStatuses || taskStatuses.length === 0) fetchTaskStatuses();
		if ((!projects || projects.length === 0) && !projectsLoaded) fetchProjects();
	}, []);

	const checkHasRelation = async (project = {}) => {
		setProjectsLoading(true);
		setTimeout(() => {
			setDialogOpen(true);
		}, 100);
		setSelectedProjectId(project.id);
		try {
			const hasRelationResponse = await axiosClient.post(API().relation_check("project", project.id));
			setHasRelation(hasRelationResponse?.data?.data?.exists);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setProjectsLoading(false);
		}
	};
	useEffect(() => {
		if (!dialogOpen) setHasRelation(false);
	}, [dialogOpen]);

	const displayProjects = searchValue.trim() ? searchProjects : projects;
	// Update search results whenever search value or sorted tasks change
	useEffect(() => {
		if (searchValue.trim()) {
			const searchResults = projects.filter((project) => {
				return project.title.toLowerCase().includes(searchValue.toLowerCase());
			});
			setSearchProjects(searchResults);
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
					<h1 className=" font-extrabold text-3xl">Projects</h1>
					<p>View list of all projects</p>
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
				{!projectsLoading && (
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
								Add Project
							</Button>
						</SheetTrigger>
					</div>
				)}
				<SheetContent side="right" className="overflow-y-auto w-[400px] sm:w-[540px]">
					<SheetHeader>
						<SheetTitle>{updateData?.id ? "Update Project" : "Add Project"}</SheetTitle>
						<SheetDescription className="sr-only">Navigate through the app using the options below.</SheetDescription>
					</SheetHeader>
					<ProjectForm setIsOpen={setIsOpen} updateData={updateData} setUpdateData={setUpdateData} />
				</SheetContent>
			</Sheet>
			{/* Updated table to fix dialog per column issue */}
			{(() => {
				const { columnsProject: projectColumns, dialog } = columnsProject({
					setIsOpen,
					setUpdateData,
					dialogOpen,
					setDialogOpen,
					checkHasRelation,
					hasRelation,
					selectedProjectId,
				});
				return (
					<>
						{view === "list" ? (
							<>
								<DataTableProjects
									columns={projectColumns}
									updateData={updateData}
									setUpdateData={setUpdateData}
									isOpen={isOpen}
									setIsOpen={setIsOpen}
								/>
								{dialog}
							</>
						) : (
							<>
								{displayProjects.length > 0 ? (
									<GridList
										projects={displayProjects}
										setIsOpen={setIsOpen}
										setUpdateData={setUpdateData}
										checkHasRelation={checkHasRelation}
										dialogOpen={dialogOpen}
										setDialogOpen={setDialogOpen}
										hasRelation={hasRelation}
										// context={context}
										// contextId={contextId}
									/>
								) : (
									<div className="text-center text-muted-foreground py-8">No projects found matching "{searchValue}"</div>
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
