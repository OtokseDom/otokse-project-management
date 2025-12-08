// src/utils/taskHelpers.js
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useCategoriesStore } from "@/store/categories/categoriesStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useTaskDiscussionsStore } from "@/store/taskDiscussions/taskDiscussionsStore";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";
import { useUserStore } from "@/store/user/userStore";
import { useUsersStore } from "@/store/users/usersStore";
import { useEffect, useState } from "react";

export const useTaskHelpers = () => {
	const { projectFilter, setProjectFilter, userFilter, setUserFilter, setReports, setDashboardReportsLoading } = useDashboardStore();
	const { setTasks, setTaskHistory, setOptions, setSelectedUser, setTasksLoading } = useTasksStore();
	const { setTaskDiscussions, setTaskDiscussionsLoading } = useTaskDiscussionsStore();
	const { setProjects, setSelectedProject, setProjectsLoading } = useProjectsStore();
	const { setUsersLoading, setUsers } = useUsersStore();
	const { setCategories, setCategoriesLoading } = useCategoriesStore();
	const { setTaskStatuses, setTaskStatusesLoading } = useTaskStatusesStore();
	const { profileProjectFilter, setProfileProjectFilter, setUserReports, setUserReportsLoading } = useUserStore();
	const { setKanbanColumns } = useKanbanColumnsStore();

	const fetchTasks = async () => {
		setTasksLoading(true);
		try {
			// const res_discussion = await axiosClient.get(API().task_discussion());
			const res = await axiosClient.get(API().task());
			setTasks(res?.data?.data?.tasks);
			setTaskHistory(res?.data?.data?.task_history);
			// setTaskDiscussions(res_discussion?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setTasksLoading(false);
		}
	};

	const fetchTaskDiscussions = async () => {
		setTaskDiscussionsLoading(true);
		try {
			const res = await axiosClient.get(API().task_discussion());
			setTaskDiscussions(res?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setTaskDiscussionsLoading(false);
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
		setTaskStatusesLoading(true);
		try {
			const res = await axiosClient.get(API().task_status());
			setTaskStatuses(res?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setTaskStatusesLoading(false);
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
export function getSubtaskProgress(task = {}, taskStatuses = []) {
	// const { taskStatuses } = useTaskStatusesStore();
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
	// If a project is selected, only include its top-level tasks; otherwise include top-level tasks across all projects
	if (selectedProject) {
		projectTasks = tasks.filter((task) => task.project_id === selectedProject.id && task.parent_id === null);
	} else {
		projectTasks = (tasks || []).filter((task) => task.parent_id === null);
	}

	const tasksCount = projectTasks.length;
	if (tasksCount === 0) {
		const text = `0/0 (0.00%) tasks completed for ${selectedProject ? "selected project" : "all projects"}`;
		return { value: 0, text };
	}

	// Sum contributions: completed parent = 100, otherwise use subtask percent (0-100)
	let totalPoints = 0;
	let completedCount = 0;
	for (const task of projectTasks) {
		const status = taskStatuses.find((s) => s.id === task.status_id);
		const name = status?.name ?? "Unknown";
		if (name === "Completed") {
			totalPoints += 100;
			completedCount++;
		} else {
			// Use subtask progress; if no children this yields 0
			const { value: subPercent } = getSubtaskProgress(task, taskStatuses);
			totalPoints += subPercent;
		}
	}

	const avgPercent = tasksCount > 0 ? totalPoints / tasksCount : 0;
	const text = `${completedCount}/${tasksCount} (${avgPercent.toFixed(2)}%) tasks completed for ${selectedProject ? "selected project" : "all projects"}`;
	return { value: avgPercent, text };
}

export function getProfileProjectProgress(id, selectedProject) {
	const { tasks } = useTasksStore();
	const { taskStatuses } = useTaskStatusesStore();
	// Filter tasks assigned to this user and that are top-level (no parent)
	const filteredUserTasks = (tasks || []).filter(
		(task) => Array.isArray(task.assignees) && task.assignees.some((user) => user.id === parseInt(id)) && task.parent_id === null
	);
	let projectTasks = [];
	// If a project is selected, only include its tasks; otherwise include all user tasks
	if (selectedProject) {
		projectTasks = filteredUserTasks.filter((task) => task.project_id === selectedProject.id);
	} else {
		projectTasks = filteredUserTasks;
	}

	const tasksCount = projectTasks.length;
	if (tasksCount === 0) {
		const text = `0/0 (0.00%) tasks completed for ${selectedProject ? "selected project" : "all projects"}`;
		return { value: 0, text };
	}

	// Sum contributions: completed parent = 100, otherwise use subtask percent (0-100)
	let totalPoints = 0;
	let completedCount = 0;
	for (const task of projectTasks) {
		const status = taskStatuses.find((s) => s.id === task.status_id);
		const name = status?.name ?? "Unknown";
		if (name === "Completed") {
			totalPoints += 100;
			completedCount++;
		} else {
			// Use subtask progress; if no children this yields 0
			const { value: subPercent } = getSubtaskProgress(task, taskStatuses);
			totalPoints += subPercent;
		}
	}

	const avgPercent = tasksCount > 0 ? totalPoints / tasksCount : 0;
	const text = `${completedCount}/${tasksCount} (${avgPercent.toFixed(2)}%) tasks completed for ${selectedProject ? "selected project" : "all projects"}`;
	return { value: avgPercent, text };
}
