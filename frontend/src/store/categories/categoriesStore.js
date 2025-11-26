import { useAppStore } from "../appStore";

export const useCategoriesStore = () => {
	return {
		categories: useAppStore((state) => state.categories),
		setCategories: useAppStore((state) => state.setCategories),
		addCategory: useAppStore((state) => state.addCategory),
		updateCategory: useAppStore((state) => state.updateCategory),
		removeCategory: useAppStore((state) => state.removeCategory),
		categoriesLoading: useAppStore((state) => state.categoriesLoading),
		setCategoriesLoading: useAppStore((state) => state.setCategoriesLoading),
	};
};
