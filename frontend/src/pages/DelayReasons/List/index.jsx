import React, { useEffect, useState } from "react";
import { DataTableDelayReasons } from "./data-table";
import { useTaskHelpers } from "@/utils/taskHelpers";
import { useDelayReasonsStore } from "@/store/delayReasons/delayReasonsStore";
import { columnsDelayReason } from "./columns";

export default function DelayReasons() {
	const { delayReasons } = useDelayReasonsStore();
	const { fetchDelayReasons } = useTaskHelpers();
	const [isOpen, setIsOpen] = useState(false);
	const [updateData, setUpdateData] = useState({});
	const [dialogOpen, setDialogOpen] = useState(false);

	useEffect(() => {
		if (!isOpen) setUpdateData({});
	}, [isOpen]);
	useEffect(() => {
		document.title = "Task Management | Delay Reasons";
		if (!delayReasons || delayReasons.length === 0) fetchDelayReasons();
	}, []);

	return (
		<div className="w-screen md:w-full bg-card text-card-foreground border border-border rounded-2xl container p-4 md:p-10 shadow-md">
			<div
				className={`fixed inset-0 bg-black bg-opacity-60  z-40 transition-opacity duration-300 pointer-events-none ${
					dialogOpen ? "opacity-100" : "opacity-0"
				}`}
				aria-hidden="true"
			/>
			<div>
				<h1 className=" font-extrabold text-3xl">Delay Reasons</h1>
				<p>View list of all delay reasons</p>
			</div>
			{/* Updated table to fix dialog per column issue */}
			{(() => {
				const { columnsDelayReason: delayReasonColumns, dialog } = columnsDelayReason({ setIsOpen, setUpdateData, dialogOpen, setDialogOpen });
				return (
					<>
						<DataTableDelayReasons
							columns={delayReasonColumns}
							updateData={updateData}
							setUpdateData={setUpdateData}
							isOpen={isOpen}
							setIsOpen={setIsOpen}
						/>
						{dialog}
					</>
				);
			})()}
		</div>
	);
}
