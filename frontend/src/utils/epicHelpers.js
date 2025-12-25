// src/utils/taskHelpers.js
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useEpicStore } from "@/store/epic/epicStore";
import { useEpicsStore } from "@/store/epics/epicsStore";

export const useEpicHelpers = () => {
	const { setEpics, setSelectedEpic, setEpicsLoading } = useEpicsStore();
	const { setEpic, setEpicLoading } = useEpicStore();

	const fetchEpics = async () => {
		setEpicsLoading(true);
		try {
			const res = await axiosClient.get(API().epic());
			setEpics(res?.data?.data?.epics);
			// setKanbanColumns(res?.data?.data?.kanbanColumns);
			setSelectedEpic(res?.data?.data?.epics[res?.data?.data?.epics?.length - 1]);
			// if (res.data.data.epics.length !== epicFilter.length || res.data.data.epics.length !== profileEpicFilter.length) {
			// 	const mappedEpics = res.data.data.epics.map((epic) => ({ value: epic.id, label: epic.title }));
			// Used in user profile
			// setProfileEpicFilter(mappedEpics);
			// Used in dashboard
			// 	setEpicFilter(mappedEpics);
			// }
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setEpicsLoading(false);
		}
	};
	// Fetch user details function
	const fetchEpic = async (id) => {
		setEpicLoading(true);
		try {
			const response = await axiosClient.get(API().epic(id));
			setEpic(response?.data?.data);
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setEpicLoading(false);
		}
	};

	return {
		fetchEpics,
		fetchEpic,
	};
};
