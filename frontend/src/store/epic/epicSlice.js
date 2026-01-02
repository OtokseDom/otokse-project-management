export const createEpicSlice = (set) => ({
	epic: {},
	epicReports: {},
	epicProjectFilter: [],
	epicSelectedProjects: [],
	epicReportsLoading: false,
	setEpicReportsLoading: (loading) => set({ epicReportsLoading: loading }),
	epicFilters: {
		values: {
			"Date Range": null,
			Projects: [],
		},
		display: {
			"Date Range": null,
			Projects: [],
		},
	},

	setEpic: (epic) => set({ epic }),
	setEpicReports: (epicReports) => set({ epicReports }),
	setEpicProjectFilter: (epicProjectFilter) => set({ epicProjectFilter }),
	setEpicSelectedProjects: (epicSelectedProjects) => set({ epicSelectedProjects }),

	setEpicFilters: (newDisplay) =>
		set((state) => ({
			epicFilters: {
				values: { ...state.epicFilters.values, ...newDisplay.values },
				display: { ...state.epicFilters.display, ...newDisplay.display },
			},
		})),

	// Load
	epicLoaded: false,
	setEpicLoaded: (loaded) => set({ epicLoaded: loaded }),
	epicLoading: false,
	setEpicLoading: (loading) => set({ epicLoading: loading }),

	// Update Form
	isOpen: false,
	setIsOpen: (isOpen) => set({ isOpen }),
	updateData: {},
	setUpdateData: (updateData) => set({ updateData }),
});
