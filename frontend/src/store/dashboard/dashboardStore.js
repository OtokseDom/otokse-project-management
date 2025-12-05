import { useAppStore } from "../appStore";

export const useDashboardStore = () => {
	return {
		reports: useAppStore((state) => state.reports),
		userFilter: useAppStore((state) => state.userFilter),
		projectFilter: useAppStore((state) => state.projectFilter),
		selectedUsers: useAppStore((state) => state.selectedUsers),
		selectedProjects: useAppStore((state) => state.selectedProjects),
		dashboardReportsLoading: useAppStore((state) => state.dashboardReportsLoading),
		setDashboardReportsLoading: useAppStore((state) => state.setDashboardReportsLoading),
		filters: useAppStore((state) => state.filters),
		setReports: useAppStore((state) => state.setReports),
		setUserFilter: useAppStore((state) => state.setUserFilter),
		addUserFilter: useAppStore((state) => state.addUserFilter),
		updateUserFilter: useAppStore((state) => state.updateUserFilter),
		removeUserFilter: useAppStore((state) => state.removeUserFilter),
		setProjectFilter: useAppStore((state) => state.setProjectFilter),
		addProjectFilter: useAppStore((state) => state.addProjectFilter),
		updateProjectFilter: useAppStore((state) => state.updateProjectFilter),
		removeProjectFilter: useAppStore((state) => state.removeProjectFilter),
		setSelectedUsers: useAppStore((state) => state.setSelectedUsers),
		setSelectedProjects: useAppStore((state) => state.setSelectedProjects),
		setFilters: useAppStore((state) => state.setFilters),
	};
};
