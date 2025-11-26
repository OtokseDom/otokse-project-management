export const createCategoriesSlice = (set) => ({
	categories: [],

	setCategories: (categories) => set({ categories }),

	addCategory: (category) =>
		set((state) => ({
			categories: [category, ...state.categories],
		})),

	updateCategory: (id, updates) =>
		set((state) => ({
			categories: state.categories.map((t) => (t.id === id ? { ...t, ...updates } : t)),
		})),

	removeCategory: (id) =>
		set((state) => ({
			categories: state.categories.filter((t) => t.id !== id),
		})),

	// Loading state
	categoriesLoading: false,
	setCategoriesLoading: (loading) => set({ categoriesLoading: loading }),
});
