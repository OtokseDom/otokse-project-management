// src/utils/taskHelpers.js
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useTaskDiscussionsStore } from "@/store/taskDiscussions/taskDiscussionsStore";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useUserStore } from "@/store/user/userStore";
import { useUsersStore } from "@/store/users/usersStore";

export const useTaskHelpers = () => {
	const { setLoading } = useLoadContext();
	const { projectFilter, setProjectFilter, userFilter, setUserFilter, setReports, setDashboardReportsLoading } = useDashboardStore();
	const { setTasks, setTaskHistory, setOptions, setSelectedUser, setTasksLoading } = useTasksStore();
	const { setTaskDiscussions } = useTaskDiscussionsStore();
	const { projects, setProjects, setSelectedProject, setProjectsLoading } = useProjectsStore();
	const { setUsersLoading, setUsers } = useUsersStore();
	const { setCategories, setCategoriesLoading } = useCategoriesStore();
	const { taskStatuses, setTaskStatuses } = useTaskStatusesStore();
	const { profileProjectFilter, setProfileProjectFilter, setUserReports, setUserReportsLoading } = useUserStore();
	const { setKanbanColumns } = useKanbanColumnsStore();

	const fetchTasks = async () => {
		setTasksLoading(true);
		try {
			const res_discussion = await axiosClient.get(API().task_discussion());
			const res = await axiosClient.get(API().task());
			setTasks(res?.data?.data?.tasks);
			setTaskHistory(res?.data?.data?.task_history);
			setTaskDiscussions(res_discussion?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setTasksLoading(false);
		}
	};

	const fetchTaskDiscussions = async () => {
		setLoading(true);
		try {
			const res = await axiosClient.get(API().task_discussion());
			setTaskDiscussions(res?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setLoading(false);
		}
	};

	const fetchProjects = async () => {
		setProjectsLoading(true);
		try {
			const res = await axiosClient.get(API().project());
			setProjects(res?.data?.data?.projects);
			setKanbanColumns(res?.data?.data?.kanbanColumns);
			setSelectedProject(res?.data?.data?.projects[res?.data?.data?.projects?.length - 1]);
			if (res.data.data.projects.length !== projectFilter.length || res.data.data.projects.length !== profileProjectFilter.length) {
				const mappedProjects = res.data.data.projects.map((project) => ({ value: project.id, label: project.title }));
				// Used in user profile
				setProfileProjectFilter(mappedProjects);
				// Used in dashboard
				setProjectFilter(mappedProjects);
			}
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setProjectsLoading(false);
		}
	};

	const fetchUsers = async () => {
		setUsersLoading(true);
		try {
			const res = await axiosClient.get(API().user());
			setUsers(res?.data?.data);
			// Used in dashboard
			if (res.data.data.length !== userFilter.length) {
				const mappedUsers = res.data.data.map((user) => ({ value: user.id, label: user.name }));
				setUserFilter(mappedUsers);
			}
			// Used in calendar
			setSelectedUser(res?.data?.data[0]);
			setOptions(res?.data?.data.map((u) => ({ value: u.id, label: u.name })));
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setUsersLoading(false);
		}
	};

	const fetchCategories = async () => {
		setCategoriesLoading(true);
		try {
			const res = await axiosClient.get(API().category());
			setCategories(res?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setCategoriesLoading(false);
		}
	};

	const fetchTaskStatuses = async () => {
		setLoading(true);
		try {
			const res = await axiosClient.get(API().task_status());
			setTaskStatuses(res?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setLoading(false);
		}
	};

	const fetchReports = async () => {
		setDashboardReportsLoading(true);
		try {
			const reportsRes = await axiosClient.get(API().dashboard());
			setReports(reportsRes.data.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setDashboardReportsLoading(false);
		}
	};

	const fetchUserReports = async (id) => {
		setUserReportsLoading(true);
		try {
			const reportsRes = await axiosClient.get(API().user_reports(id));
			setUserReports(reportsRes?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setUserReportsLoading(false);
		}
	};

	return {
		fetchTasks,
		fetchTaskDiscussions,
		fetchProjects,
		fetchUsers,
		fetchCategories,
		fetchTaskStatuses,
		fetchReports,
		fetchUserReports,
	};
};

export function flattenTasks(tasks) {
	// Get IDs of all children
	const childIds = new Set();
	if (tasks === null) return [];
	tasks.forEach((task) => {
		task.children?.forEach((child) => {
			childIds.add(child.id);
		});
	});

	// Filter only tasks NOT in children list (top-level only)
	const topLevelTasks = (tasks ?? []).filter((task) => !childIds.has(task.id));

	const flatten = (taskList, depth = 0) => {
		let flat = [];
		for (const task of taskList) {
			flat.push({ ...task, depth });
			if (task.children?.length) {
				flat = flat.concat(flatten(task.children, depth + 1));
			}
		}
		return flat;
	};

	return flatten(topLevelTasks);
}

export const statusColors = {
	yellow: "bg-yellow-100 border border-yellow-800 border-2 text-yellow-800",
	blue: "bg-blue-100 border border-blue-800 border-2 text-blue-800",
	orange: "bg-orange-100 border border-orange-800 border-2 text-orange-800",
	green: "bg-green-100 border border-green-800 border-2 text-green-800",
	red: "bg-red-100 border border-red-800 border-2 text-red-800",
	purple: "bg-purple-100 border border-purple-800 border-2 text-purple-800",
	gray: "bg-gray-100 border border-gray-800 border-2 text-gray-800",
};

export const priorityColors = {
	Low: "bg-gray-100 border border-gray-800 border-2 text-foreground bg-opacity-20",
	Medium: "bg-yellow-100 border border-yellow-800 border-2 text-foreground bg-opacity-20",
	High: "bg-purple-100 border border-purple-800 border-2 text-foreground bg-opacity-20",
	Urgent: "bg-orange-100 border border-orange-800 border-2 text-foreground bg-opacity-20",
	Critical: "bg-red-100 border border-red-800 border-2 text-foreground bg-opacity-20",
};

// New helper: compute subtask progress for a given task and taskStatuses array
export function getSubtaskProgress(task = {}) {
	const { taskStatuses } = useTaskStatusesStore();
	const children = Array.isArray(task?.children) ? task.children : [];
	const subTasksCount = children.length;
	const completedCount = children.filter((child) => {
		const status = taskStatuses.find((s) => s.id === child.status_id);
		const name = status?.name ?? "Unknown";
		return name === "Completed";
	}).length;
	const value = subTasksCount > 0 ? (completedCount / subTasksCount) * 100 : 0;
	const text = `${completedCount}/${subTasksCount} subtasks completed (${value.toFixed(2)}%)`;
	return { value, text };
}

export function getProjectProgress() {
	const { tasks } = useTasksStore();
	const { taskStatuses } = useTaskStatusesStore();
	const { selectedProject } = useProjectsStore();
	let projectTasks = [];
	// If project tasks is empty, all projects selected
	if (selectedProject) {
		projectTasks = tasks.filter((task) => task.project_id === selectedProject.id && task.parent_id === null);
	} else {
		projectTasks = tasks;
	}
	const tasksCount = projectTasks.length;
	const completedCount = projectTasks.filter((task) => {
		const status = taskStatuses.find((s) => s.id === task.status_id);
		const name = status?.name ?? "Unknown";
		return name === "Completed";
	}).length;
	const value = tasksCount > 0 ? (completedCount / tasksCount) * 100 : 0;
	const text = `${completedCount}/${tasksCount} (${value.toFixed(2)}%) tasks completed for ${selectedProject ? "selected project" : "all projects"}`;
	return { value, text };
}
