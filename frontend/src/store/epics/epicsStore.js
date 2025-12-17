import { useAppStore } from "../appStore";

export const useEpicsStore = () => {
	return {
		epics: useAppStore((state) => state.epics),
		setEpics: useAppStore((state) => state.setEpics),
		addEpic: useAppStore((state) => state.addEpic),
		updateEpic: useAppStore((state) => state.updateEpic),
		removeEpic: useAppStore((state) => state.removeEpic),
		selectedEpic: useAppStore((state) => state.selectedEpic),
		setSelectedEpic: useAppStore((state) => state.setSelectedEpic),
		removeSelectedEpic: useAppStore((state) => state.removeSelectedEpic),
		epicsLoaded: useAppStore((state) => state.epicsLoaded),
		setEpicsLoaded: useAppStore((state) => state.setEpicsLoaded),
		epicsLoading: useAppStore((state) => state.epicsLoading),
		setEpicsLoading: useAppStore((state) => state.setEpicsLoading),
	};
};
