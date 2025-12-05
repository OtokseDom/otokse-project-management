import { useAppStore } from "../appStore";

export const useTaskStatusesStore = () => {
	return {
		taskStatuses: useAppStore((state) => state.taskStatuses),
		setTaskStatuses: useAppStore((state) => state.setTaskStatuses),
		addTaskStatus: useAppStore((state) => state.addTaskStatus),
		updateTaskStatus: useAppStore((state) => state.updateTaskStatus),
		removeTaskStatus: useAppStore((state) => state.removeTaskStatus),
		taskStatusesLoading: useAppStore((state) => state.taskStatusesLoading),
		setTaskStatusesLoading: useAppStore((state) => state.setTaskStatusesLoading),
	};
};
