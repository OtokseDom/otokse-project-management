import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Flag, Plus, Rows3, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import axiosClient from "@/axios.client";
import { columnsTask } from "@/pages/Tasks/List/datatable/columns";
import { DataTableTasks } from "@/pages/Tasks/List/datatable/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PieChartDonut } from "@/components/chart/pie-chart-donut";
import GalaxyProfileBanner from "@/components/design/galaxy";
import { AreaChartGradient } from "@/components/chart/area-chart-gradient";
import { RadarChartGridFilled } from "@/components/chart/radar-chart-grid-filled";
import { ChartLineLabel } from "@/components/chart/line-chart-label";
import { ChartBarMultiple } from "@/components/chart/bar-chart-multiple";
import { ChartBarLabel } from "@/components/chart/bar-chart-label";
import UserDetails from "@/pages/Users/Show/details";
import { SectionCard } from "@/components/chart/section-card";
import FilterForm from "@/components/form/filter-form";
import FilterTags from "@/components/form/FilterTags";
import { API } from "@/constants/api";
import GalaxyProgressBar from "@/components/design/GalaxyProgressBar";
import { flattenTasks, getProfileProjectProgress, useTaskHelpers } from "@/utils/taskHelpers";
import { useUsersStore } from "@/store/users/usersStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useUserStore } from "@/store/user/userStore";
import UserForm from "../form";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TaskForm from "../../Tasks/form.jsx";
import History from "@/components/task/History";
import Relations from "@/components/task/Relations";
import Tabs from "@/components/task/Tabs";
import { TaskDiscussions } from "@/components/task/Discussion";
import GridList from "@/pages/Tasks/List/grid/gridList";
import { Progress } from "@/components/ui/progress";

export default function EpicDetails() {
	const { id } = useParams();

	return (
		<div className="flex flex-col w-screen md:w-full container p-5 md:p-0 sm:text-sm -mt-10">
			{/* <div
				className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none ${
					isOpen || isOpenUser || isOpenFilter || dialogOpen || deleteDialogOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/> */}

			{/* Back button */}
			<Link to="/users">
				<Button variant="ghost" className="flex items-center">
					<ArrowLeft />
				</Button>
			</Link>

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
			<div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2 auto-rows-auto mt-4">
				<div className="col-span-12 mb-4">
					<h1 className="flex items-start md:items-center gap-4 font-bold text-3xl">
						<Flag className="hidden md:block" size={24} /> Some of the most epic title in the history
					</h1>
					{/* <p>View list of all epics</p> */}
				</div>
				{/* Main Panel */}
				<div className="col-span-12 md:col-span-8 h-fit flex flex-col gap-2">
					{/* Epic Details - mobile view */}
					<div className="block md:hidden bg-card text-card-foreground border border-border rounded-xl container p-6">
						<div className="flex w-full font-bold text-lg mb-4">Details</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
					</div>
					{/* Epic Projects */}
					<div className="bg-card text-card-foreground border border-border rounded-xl container p-6">
						<div className="flex w-full font-bold text-lg mb-4">Projects</div>
						<div className="flex overflow-auto justify-start items-start gap-2 pb-2">
							<Button variant="secondary" className="min-w-fit">
								Long ass Project name with uninterruptability. Niyugon mo yan. Ata ka na
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Project 2
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Project 3
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Project 4
							</Button>
						</div>
					</div>
					{/* Epic Project-Tasks */}
					{/* TODO: Bring grid list and item here */}
					<div className="bg-card text-card-foreground max-h-screen overflow-auto border border-border rounded-xl container p-6">
						<div className="flex w-full font-bold text-lg mb-4">Tasks</div>
						<div className="flex flex-col justify-start items-start gap-2 pb-2">
							<Button variant="secondary" className="min-w-fit">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Task 2
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Task 3
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
							<Button variant="secondary" className="w-fit md:w-full">
								Long ass Task name with uninterruptability. Niyugon mo yan. Ata ka na Task 4
							</Button>
						</div>
					</div>
				</div>
				{/* Side panel */}
				<div className="col-span-12 md:col-span-4 h-fit flex flex-col gap-2">
					{/* Epic Details */}
					<div className="hidden md:block bg-card text-card-foreground border border-border rounded-xl container p-6">
						<div className="flex w-full font-bold text-lg mb-4">Details</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
					</div>
					{/* Some Widgets */}

					<div className="bg-card text-card-foreground border border-border rounded-xl container p-6">
						<div className="flex w-full font-bold text-lg mb-4">Widget here</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
						<div className="flex flex-wrap justify-start items-center gap-4">Long description of epic here. Can be Markdown in future.</div>
					</div>
				</div>
			</div>
		</div>
	);
}
