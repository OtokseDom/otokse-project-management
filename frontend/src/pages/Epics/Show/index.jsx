import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDaysIcon, Flag, Plus, Rows3, Table, User } from "lucide-react";
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
import { statusColors, priorityColors, flattenTasks, getProfileProjectProgress, useTaskHelpers } from "@/utils/taskHelpers";
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
import { useEpicHelpers } from "@/utils/epicHelpers";
import { useEpicStore } from "@/store/epic/epicStore";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import Tasks from "@/pages/Tasks/List";
import EpicDetails from "./details";
import { useEpicsStore } from "@/store/epics/epicsStore";
import Projects from "@/pages/Projects/List";

export default function Epic() {
	const { id } = useParams();
	const { epic, epicLoading } = useEpicStore();
	const { setSelectedEpic } = useEpicsStore();
	const { fetchEpic } = useEpicHelpers();
	// Fetch user details and reports when ID changes
	useEffect(() => {
		document.title = "Task Management | Epic";
		if (Object.keys(epic).length === 0 || parseInt(epic.id) !== parseInt(id)) fetchEpic(id);
		setSelectedEpic(id);
		// if (!epicReports || epicReports.length === 0 || epic.id != parseInt(id)) fetchEpicReports(id);
	}, [id]);

	return (
		<div className="flex flex-col w-screen md:w-full container  sm:text-sm">
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
			<div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto mt-4">
				<EpicDetails />
				<div className="col-span-6 h-fit flex flex-col gap-2">
					<Projects />
				</div>
				<div className="col-span-6 h-fit flex flex-col gap-2">
					<Tasks />
				</div>
			</div>
		</div>
	);
}
