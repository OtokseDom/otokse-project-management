import { useAppStore } from "../appStore";

export const useScrollStore = () => {
	return {
		scrollToTarget: useAppStore((state) => state.scrollToTarget),
		setScrollToTarget: useAppStore((state) => state.setScrollToTarget),
	};
};
