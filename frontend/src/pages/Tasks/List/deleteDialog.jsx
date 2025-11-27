"use client";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { API } from "@/constants/api";
import axiosClient from "@/axios.client";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useToast } from "@/contexts/ToastContextProvider";
import { useTasksStore } from "@/store/tasks/tasksStore";

export default function DeleteDialog({ dialogOpen, setDialogOpen, hasRelation, selectedTaskId, selectedTasks = [], clearSelection }) {
	const showToast = useToast();
	const { fetchTasks, fetchReports } = useTaskHelpers();
	const { tasksLoading, setTasksLoading } = useTasksStore();
	const ids = selectedTasks.map((t) => t.id);
	const isBulk = ids.length > 1;
	const hasAnyRelation = selectedTasks.some((t) => t.children && t.children.length > 0);

	const handleDelete = async (ids, deleteSubtasks = false) => {
		setTasksLoading(true);
		try {
			if (isBulk) {
				await axiosClient.delete(API().task_bulk_delete(), {
					data: { ids, delete_subtasks: deleteSubtasks },
				});
			} else {
				await axiosClient.delete(API().task(ids[0]), {
					data: { delete_subtasks: deleteSubtasks },
				});
			}
			fetchTasks();
			fetchReports();
			showToast("Success!", "Task(s) deleted.", 3000);
			if (clearSelection) clearSelection(); // <-- Only clear after success
		} catch (e) {
			showToast("Failed!", e.response?.data?.message, 3000, "fail");
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setTasksLoading(false);
		}
	};
	return (
		<Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={false}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you absolutely sure?</DialogTitle>
					<DialogDescription>This action cannot be undone.</DialogDescription>
				</DialogHeader>
				<div className="ml-4 text-base">
					{hasAnyRelation && (
						<>
							<span className="text-yellow-800">Warning: {isBulk ? "Some tasks have subtasks" : "Task has subtasks"}</span>
							<br />
							<span>Do you wish to delete subtasks as well?</span>
						</>
					)}
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button type="button" variant="secondary">
							Close
						</Button>
					</DialogClose>
					{hasAnyRelation && (
						<Button
							disabled={tasksLoading}
							variant="destructive"
							onClick={() => {
								setDialogOpen(false);
								handleDelete(ids, true);
							}}
						>
							Delete {isBulk ? "with all subtasks" : "with subtasks"}
						</Button>
					)}
					<Button
						disabled={tasksLoading}
						onClick={() => {
							setDialogOpen(false);
							handleDelete(ids, false);
						}}
					>
						{hasAnyRelation ? (isBulk ? "Delete selected tasks only" : "Delete this task only") : isBulk ? "Yes, delete selected" : "Yes, delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
