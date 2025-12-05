import { Loader2 } from "lucide-react";

export default function Tabs({ loading, updateData, activeTab, setActiveTab, parentId }) {
	return (
		<div className="flex flex-row gap-5">
			{Object.keys(updateData).length > 0 && updateData.id ? (
				<div className="flex flex-row items-center overflow-auto">
					<div className="flex flex-row h-fit border-b-2 border-b-bg-secondary bg-card text-sm">
						<div className={`w-fit whitespace-nowrap py-2 px-5 ${activeTab == "update" ? "bg-secondary" : "text-muted-foreground"} rounded-t`}>
							<button onClick={() => setActiveTab("update")}>Update Task</button>
						</div>
						<div className={`w-fit py-2 px-5 ${activeTab == "relations" ? "bg-secondary" : "text-muted-foreground"} rounded-t`}>
							<button onClick={() => setActiveTab("relations")}>Relations</button>
						</div>
						<div className={`w-fit py-2 px-5 ${activeTab == "discussions" ? "bg-secondary" : "text-muted-foreground"} rounded-t`}>
							<button onClick={() => setActiveTab("discussions")}>Discussions</button>
						</div>
						<div className={`w-fit py-2 px-5 ${activeTab == "history" ? "bg-secondary" : "text-muted-foreground"} rounded-t`}>
							<button onClick={() => setActiveTab("history")}>History</button>
						</div>
					</div>
					<span>{loading && <Loader2 className="animate-spin" />}</span>
				</div>
			) : parentId ? (
				<div className="flex flex-row items-center">
					<div className="flex flex-row w-fit h-fit border-b-2 border-b-bg-secondary bg-card text-sm">
						<div className={`w-fit py-2 px-5 ${activeTab == "update" ? "bg-secondary" : "text-muted-foreground"} rounded-t`}>
							<button onClick={() => setActiveTab("update")}>Add Subtask</button>
						</div>
						<div className={`w-fit py-2 px-5 ${activeTab == "relations" ? "bg-secondary" : "text-muted-foreground"} rounded-t`}>
							<button onClick={() => setActiveTab("relations")}>Relations</button>
						</div>
					</div>
					<span>{loading && <Loader2 className="animate-spin" />}</span>
				</div>
			) : (
				"Add Task"
			)}
		</div>
	);
}
