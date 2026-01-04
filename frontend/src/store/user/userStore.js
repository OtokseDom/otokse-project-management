import { useAppStore } from "../appStore";

export const useUserStore = () => {
	return {
		user: useAppStore((state) => state.user),
		setUser: useAppStore((state) => state.setUser),
		userReports: useAppStore((state) => state.userReports),
		setUserReports: useAppStore((state) => state.setUserReports),
		userReportsLoading: useAppStore((state) => state.userReportsLoading),
		setUserReportsLoading: useAppStore((state) => state.setUserReportsLoading),
		profileFilters: useAppStore((state) => state.profileFilters),
		setProfileFilters: useAppStore((state) => state.setProfileFilters),
		// Projects
		profileProjectFilter: useAppStore((state) => state.profileProjectFilter),
		setProfileProjectFilter: useAppStore((state) => state.setProfileProjectFilter),
		profileSelectedProjects: useAppStore((state) => state.profileSelectedProjects),
		setProfileSelectedProjects: useAppStore((state) => state.setProfileSelectedProjects),
		// Epics
		profileEpicFilter: useAppStore((state) => state.profileEpicFilter),
		setProfileEpicFilter: useAppStore((state) => state.setProfileEpicFilter),
		profileSelectedEpics: useAppStore((state) => state.profileSelectedEpics),
		setProfileSelectedEpics: useAppStore((state) => state.setProfileSelectedEpics),
	};
};
