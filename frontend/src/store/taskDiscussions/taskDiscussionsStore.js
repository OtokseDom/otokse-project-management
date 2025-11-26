import { useAppStore } from "../appStore";

export const useTaskDiscussionsStore = () => {
	return {
		taskDiscussions: useAppStore((state) => state.taskDiscussions),
		selectedTaskDiscussions: useAppStore((state) => state.selectedTaskDiscussions),
		taskDiscussionsLoaded: useAppStore((state) => state.taskDiscussionsLoaded),
		setTaskDiscussions: useAppStore((state) => state.setTaskDiscussions),
		setSelectedTaskDiscussions: useAppStore((state) => state.setSelectedTaskDiscussions),
		setTaskDiscussionsLoaded: useAppStore((state) => state.setTaskDiscussionsLoaded),
		addTaskDiscussion: useAppStore((state) => state.addTaskDiscussion),
		updateTaskDiscussion: useAppStore((state) => state.updateTaskDiscussion),
		removeTaskDiscussion: useAppStore((state) => state.removeTaskDiscussion),
		taskDiscussionsLoading: useAppStore((state) => state.taskDiscussionsLoading),
		setTaskDiscussionsLoading: useAppStore((state) => state.setTaskDiscussionsLoading),
	};
};
