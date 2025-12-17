export const createEpicsSlice = (set) => ({
	epics: [],

	setEpics: (epics) => set({ epics, epicsLoaded: true }),
	addEpic: (epic) =>
		set((state) => ({
			epics: [epic, ...state.epics],
		})),

	updateEpic: (id, updates) =>
		set((state) => ({
			epics: state.epics.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		})),

	removeEpic: (id) =>
		set((state) => ({
			epics: state.epics.filter((t) => t.id !== id),
		})),
	// Kanban filter
	selectedEpic: null,
	setSelectedEpic: (selectedEpic) => set({ selectedEpic }),
	removeSelectedEpic: () => set({ selectedEpic: null }),

	// Load
	epicsLoaded: false,
	setEpicsLoaded: (loaded) => set({ epicsLoaded: loaded }),
	epicsLoading: false,
	setEpicsLoading: (loading) => set({ epicsLoading: loading }),
});
