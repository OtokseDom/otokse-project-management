export const createDelayReasonsSlice = (set) => ({
	delayReasons: [],

	setDelayReasons: (delayReasons) => set({ delayReasons }),

	addDelayReason: (delayReason) =>
		set((state) => ({
			delayReasons: [delayReason, ...state.delayReasons],
		})),

	updateDelayReason: (id, updates) =>
		set((state) => ({
			delayReasons: state.delayReasons.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		})),

	removeDelayReason: (id) =>
		set((state) => ({
			delayReasons: state.delayReasons.filter((t) => t.id !== id),
		})),

	// Loading state
	delayReasonsLoading: false,
	setDelayReasonsLoading: (loading) => set({ delayReasonsLoading: loading }),
});
