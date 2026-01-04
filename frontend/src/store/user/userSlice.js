export const createUserSlice = (set) => ({
	user: {},
	userReports: {},
	profileEpicFilter: [],
	profileProjectFilter: [],
	profileSelectedProjects: [],
	userReportsLoading: false,
	setUserReportsLoading: (loading) => set({ userReportsLoading: loading }),
	profileFilters: {
		values: {
			"Date Range": null,
			Projects: [],
			Epics: [],
		},
		display: {
			"Date Range": null,
			Projects: [],
			Epics: [],
		},
	},

	setUser: (user) => set({ user }),
	setUserReports: (userReports) => set({ userReports }),
	setProfileProjectFilter: (profileProjectFilter) => set({ profileProjectFilter }),
	setProfileSelectedProjects: (profileSelectedProjects) => set({ profileSelectedProjects }),
	setProfileEpicFilter: (profileEpicFilter) => set({ profileEpicFilter }),
	setProfileSelectedEpics: (profileSelectedEpics) => set({ profileSelectedEpics }),

	setProfileFilters: (newDisplay) =>
		set((state) => ({
			profileFilters: {
				values: { ...state.profileFilters.values, ...newDisplay.values },
				display: { ...state.profileFilters.display, ...newDisplay.display },
			},
		})),
});
