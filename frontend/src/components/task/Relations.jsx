import { statusColors, getSubtaskProgress } from "@/utils/taskHelpers";
import { Inspect } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useTasksStore } from "@/store/tasks/tasksStore";
import { useTaskStatusesStore } from "@/store/taskStatuses/taskStatusesStore";

export default function Relations({ setUpdateData, setParentId, setProjectId }) {
	const { relations, setActiveTab, taskHistory, setSelectedTaskHistory } = useTasksStore();
	const { taskStatuses } = useTaskStatusesStore();
	const findStatus = (status_id) => {
		const name = taskStatuses.find((status) => status.id === status_id)?.name || "Unknown";
		const color = taskStatuses.find((status) => status.id === status_id)?.color || "gray";
		return { name, color };
	};
	// use shared helper instead of local duplicated logic
	const { text: subtaskProgressText, value: subtaskProgressValue, subTasksCount } = getSubtaskProgress(relations, taskStatuses);

	return (
		<>
			{Array.isArray(relations.children) && relations.children.length > 0 ? (
				<div className="flex flex-col border rounded-xl text-sm overflow-hidden">
					<div className="flex flex-col justify-between rounded-lg p-4 gap-4">
						<span
							className={`px-2 py-1 text-center whitespace-nowrap rounded-full h-fit w-fit text-xs ${
								statusColors[findStatus(relations.status_id).color] || "bg-gray-200 text-gray-800"
							}`}
						>
							{findStatus(relations.status_id).name}
						</span>
						<div className="flex flex-row w-full justify-between items-start">
							<span className="text-lg">{relations.title}</span>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setUpdateData(relations);
									setActiveTab("update");
									const filteredHistory = taskHistory.filter((th) => th.task_id === relations.id);
									setSelectedTaskHistory(filteredHistory);
								}}
							>
								<Inspect />
							</Button>
						</div>
						<div className="mb-4">
							<span className="text-muted-foreground">{subtaskProgressText}</span>
							<Progress value={subtaskProgressValue} className="h-3" />
						</div>
					</div>
					<div className="flex flex-col bg-sidebar-accent">
						{relations?.children?.map((child) => (
							<div key={child.id} className="flex flex-row px-4 py-6 gap-2 hover:bg-secondary border-b">
								<div className="flex flex-row w-full justify-between">
									<div className="flex flex-row h-fit items-center gap-2">
										<span
											className={`px-2 py-1 text-center whitespace-nowrap rounded-full h-fit w-fit text-xs ${
												statusColors[findStatus(child.status_id).color] || "bg-gray-200 text-gray-800"
											}`}
										>
											{findStatus(child.status_id).name}
										</span>
										<span className="">{child?.title}</span>
									</div>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setUpdateData(child);
											setActiveTab("update");
											const filteredHistory = taskHistory.filter((th) => th.task_id === child.id);
											setSelectedTaskHistory(filteredHistory);
										}}
									>
										<Inspect />
									</Button>
								</div>
							</div>
						))}
					</div>
					<Button
						variant="ghost"
						className="w-full rounded-none"
						onClick={() => {
							setParentId(relations?.id);
							setProjectId(relations?.project_id);
							setUpdateData({});
							setActiveTab("update");
						}}
					>
						Add Subtask
					</Button>
				</div>
			) : (
				<>
					<div className="w-full text-muted-foreground text-lg text-center p-4">No Related Tasks</div>
					<Button
						className="w-full rounded"
						onClick={() => {
							setParentId(relations?.id);
							setProjectId(relations?.project_id);
							setUpdateData({});
							setActiveTab("update");
						}}
					>
						Add Subtask
					</Button>
				</>
			)}
		</>
	);
}
