import { useAppStore } from "../appStore";

export const useDelayReasonsStore = () => {
	return {
		delayReasons: useAppStore((state) => state.delayReasons),
		setDelayReasons: useAppStore((state) => state.setDelayReasons),
		addDelayReason: useAppStore((state) => state.addDelayReason),
		updateDelayReason: useAppStore((state) => state.updateDelayReason),
		removeDelayReason: useAppStore((state) => state.removeDelayReason),
		delayReasonsLoading: useAppStore((state) => state.delayReasonsLoading),
		setDelayReasonsLoading: useAppStore((state) => state.setDelayReasonsLoading),
	};
};
