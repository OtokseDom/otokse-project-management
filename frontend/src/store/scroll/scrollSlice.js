export const createScrollSlice = (set) => ({
	scrollToTarget: null, // function to scroll
	setScrollToTarget: (fn) => set({ scrollToTarget: fn }),
});
