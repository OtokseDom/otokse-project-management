"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/store/projects/projectsStore";
import { useDashboardStore } from "@/store/dashboard/dashboardStore";
import { useKanbanColumnsStore } from "@/store/kanbanColumns/kanbanColumnsStore";
import { API } from "@/constants/api";
import axiosClient from "@/axios.client";
import { useToast } from "@/contexts/ToastContextProvider";

export default function DeleteDialog({ dialogOpen, setDialogOpen, hasRelation, selectedProjectId }) {
	const { projectsLoading, removeProject, removeSelectedProject, setProjectsLoading } = useProjectsStore([]);
	const { removeProjectFilter } = useDashboardStore();
	const { removeKanbanColumnByProject } = useKanbanColumnsStore();
	const showToast = useToast();

	const handleDelete = async (id) => {
		setProjectsLoading(true);
		try {
			await axiosClient.delete(API().project(id));
			removeProject(id);
			removeKanbanColumnByProject(id);
			removeProjectFilter(id);
			removeSelectedProject();
			showToast("Success!", "Project deleted.", 3000);
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setDialogOpen(false);
			setProjectsLoading(false);
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
							<span className="text-yellow-800">Project cannot be deleted because it has assigned tasks.</span>
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
							disabled={projectsLoading}
							onClick={() => {
								handleDelete(selectedProjectId);
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
