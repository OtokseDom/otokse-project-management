import { useAppStore } from "../appStore";

export const useDashboardStore = () => {
	return {
		reports: useAppStore((state) => state.reports),
		setReports: useAppStore((state) => state.setReports),
		dashboardReportsLoading: useAppStore((state) => state.dashboardReportsLoading),
		setDashboardReportsLoading: useAppStore((state) => state.setDashboardReportsLoading),
		filters: useAppStore((state) => state.filters),
		setFilters: useAppStore((state) => state.setFilters),
		// Users
		userFilter: useAppStore((state) => state.userFilter),
		selectedUsers: useAppStore((state) => state.selectedUsers),
		setSelectedUsers: useAppStore((state) => state.setSelectedUsers),
		setUserFilter: useAppStore((state) => state.setUserFilter),
		addUserFilter: useAppStore((state) => state.addUserFilter),
		updateUserFilter: useAppStore((state) => state.updateUserFilter),
		removeUserFilter: useAppStore((state) => state.removeUserFilter),
		// Projects
		projectFilter: useAppStore((state) => state.projectFilter),
		selectedProjects: useAppStore((state) => state.selectedProjects),
		setSelectedProjects: useAppStore((state) => state.setSelectedProjects),
		setProjectFilter: useAppStore((state) => state.setProjectFilter),
		addProjectFilter: useAppStore((state) => state.addProjectFilter),
		updateProjectFilter: useAppStore((state) => state.updateProjectFilter),
		removeProjectFilter: useAppStore((state) => state.removeProjectFilter),
		// Epics
		epicFilter: useAppStore((state) => state.epicFilter),
		selectedEpics: useAppStore((state) => state.selectedEpics),
		setSelectedEpics: useAppStore((state) => state.setSelectedEpics),
		setEpicFilter: useAppStore((state) => state.setEpicFilter),
		addEpicFilter: useAppStore((state) => state.addEpicFilter),
		updateEpicFilter: useAppStore((state) => state.updateEpicFilter),
		removeEpicFilter: useAppStore((state) => state.removeEpicFilter),
	};
};
