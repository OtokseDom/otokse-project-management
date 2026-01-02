import { dialog } from "@material-tailwind/react";
import { useAppStore } from "../appStore";

export const useEpicStore = () => {
	return {
		epic: useAppStore((state) => state.epic),
		setEpic: useAppStore((state) => state.setEpic),
		epicReports: useAppStore((state) => state.epicReports),
		setEpicReports: useAppStore((state) => state.setEpicReports),
		epicReportsLoading: useAppStore((state) => state.epicReportsLoading),
		setEpicReportsLoading: useAppStore((state) => state.setEpicReportsLoading),
		epicProjectFilter: useAppStore((state) => state.epicProjectFilter),
		setEpicProjectFilter: useAppStore((state) => state.setEpicProjectFilter),
		epicSelectedProjects: useAppStore((state) => state.epicSelectedProjects),
		setEpicSelectedProjects: useAppStore((state) => state.setEpicSelectedProjects),
		epicFilters: useAppStore((state) => state.epicFilters),
		setEpicFilters: useAppStore((state) => state.setEpicFilters),
		epicLoaded: useAppStore((state) => state.epicLoaded),
		setEpicLoaded: useAppStore((state) => state.setEpicLoaded),
		epicLoading: useAppStore((state) => state.epicLoading),
		setEpicLoading: useAppStore((state) => state.setEpicLoading),
		isOpen: useAppStore((state) => state.isOpen),
		setIsOpen: useAppStore((state) => state.setIsOpen),
		updateData: useAppStore((state) => state.updateData),
		setUpdateData: useAppStore((state) => state.setUpdateData),
		selectedEpicId: useAppStore((state) => state.selectedEpicId),
		setSelectedEpicId: useAppStore((state) => state.setSelectedEpicId),
		hasRelation: useAppStore((state) => state.hasRelation),
		setHasRelation: useAppStore((state) => state.setHasRelation),
		dialogOpen: useAppStore((state) => state.dialogOpen),
		setDialogOpen: useAppStore((state) => state.setDialogOpen),
	};
};
