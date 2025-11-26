export const createTaskStatusesSlice = (set) => ({
	taskStatuses: [],

	setTaskStatuses: (taskStatuses) => set({ taskStatuses }),

	addTaskStatus: (taskStatus) =>
		set((state) => ({
			taskStatuses: [taskStatus, ...state.taskStatuses],
		})),

	updateTaskStatus: (id, updates) =>
		set((state) => ({
			taskStatuses: state.taskStatuses.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		})),

	removeTaskStatus: (id) =>
		set((state) => ({
			taskStatuses: state.taskStatuses.filter((t) => t.id !== id),
		})),

	// Loading State
	taskStatusesLoading: false,
	setTaskStatusesLoading: (loading) => set({ taskStatusesLoading: loading }),
});
