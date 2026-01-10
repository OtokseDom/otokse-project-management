// src/utils/taskHelpers.js
import axiosClient from "@/axios.client";
import { API } from "@/constants/api";
import { useToast } from "@/contexts/ToastContextProvider";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useEpicStore } from "@/store/epic/epicStore";
import { useEpicsStore } from "@/store/epics/epicsStore";
import { useUserStore } from "@/store/user/userStore";
import { useEffect } from "react";

export const useEpicHelpers = () => {
	const { epicFilter, setEpicFilter } = useDashboardStore();
	const { profileEpicFilter, setProfileEpicFilter } = useUserStore();
	const { setEpics, setSelectedEpic, setEpicsLoading } = useEpicsStore();
	const { setEpic, setEpicLoading, setIsOpen, setUpdateData, dialogOpen, setDialogOpen, setSelectedEpicId, setHasRelation } = useEpicStore();
	const showToast = useToast();

	const fetchEpics = async () => {
		setEpicsLoading(true);
		try {
			const res = await axiosClient.get(API().epic());
			setEpics(res?.data?.data?.epics);
			// setKanbanColumns(res?.data?.data?.kanbanColumns);
			setSelectedEpic(res?.data?.data?.epics[res?.data?.data?.epics?.length - 1]?.id);
			if (res.data.data.epics.length !== epicFilter.length || res.data.data.epics.length !== profileEpicFilter.length) {
				const mappedEpics = res.data.data.epics.map((epic) => ({ value: epic.id, label: epic.title }));
				// Used in user profile
				setProfileEpicFilter(mappedEpics);
				// Used in dashboard
				setEpicFilter(mappedEpics);
			}
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

	// Update epic

	const handleUpdateEpic = (epic) => {
		setTimeout(() => {
			setIsOpen(true);
			setUpdateData(epic);
		}, 100);
	};

	// Delete epic

	useEffect(() => {
		if (!dialogOpen) setHasRelation(false);
	}, [dialogOpen]);

	const checkHasRelation = async (epic = {}) => {
		setEpicsLoading(true);
		setTimeout(() => {
			setDialogOpen(true);
		}, 100);
		setSelectedEpicId(epic.id);
		try {
			const hasRelationResponse = await axiosClient.post(API().relation_check("epic", epic.id));
			setHasRelation(hasRelationResponse?.data?.data?.exists);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setEpicsLoading(false);
		}
	};

	return {
		fetchEpics,
		fetchEpic,
		handleUpdateEpic,
		checkHasRelation,
	};
};
