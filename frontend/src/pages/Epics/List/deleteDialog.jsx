"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEpicsStore } from "@/store/epics/epicsStore";
// import { useDashboardStore } from "@/store/dashboard/dashboardStore";
// import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";
import { API } from "@/constants/api";
import axiosClient from "@/axios.client";
import { useToast } from "@/contexts/ToastContextProvider";

export default function DeleteDialog({ dialogOpen, setDialogOpen, hasRelation, selectedEpicId }) {
	const { epicsLoading, removeEpic, removeSelectedEpic, setEpicsLoading } = useEpicsStore([]);
	// const { removeEpicFilter } = useDashboardStore();
	// const { removeKanbanColumnByEpic } = useKanbanColumnsStore();
	const showToast = useToast();

	const handleDelete = async (id) => {
		setEpicsLoading(true);
		try {
			await axiosClient.delete(API().epic(id));
			removeEpic(id);
			// removeKanbanColumnByEpic(id);
			// removeEpicFilter(id);
			removeSelectedEpic();
			showToast("Success!", "Epic deleted.", 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setDialogOpen(false);
			setEpicsLoading(false);
		}
	};

	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={true}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{hasRelation ? <span className="text-yellow-800">Warning</span> : "Are you absolutely sure?"}</DialogTitle>
					<DialogDescription>{!hasRelation && "This action cannot be undone."}</DialogDescription>
				</DialogHeader>
				<div className="ml-4 text-base">
					{hasRelation && (
						<>
							<span className="text-yellow-800">Epic cannot be deleted because it has assigned projects.</span>
						</>
					)}
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="secondary">
							Close
						</Button>
					</DialogClose>
					{!hasRelation && (
						<Button
							disabled={epicsLoading}
							onClick={() => {
								handleDelete(selectedEpicId);
								setDialogOpen(false);
							}}
						>
							Yes, delete
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
