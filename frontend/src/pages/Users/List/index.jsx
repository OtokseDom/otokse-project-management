import axiosClient from "@/axios.client";
import React, { useEffect, useState } from "react";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useAuthContext } from "@/contexts/AuthContextProvider";
import { API } from "@/constants/api";
import { useUsersStore } from "@/store/users/usersStore";
import { useTasksStore } from "@/store/tasks/tasksStore";

export default function Users() {
	const { user } = useAuthContext();
	const { users, setUsers, setUsersLoading } = useUsersStore();
	const { setOptions } = useTasksStore();
	const [isOpen, setIsOpen] = useState(false);
	const [updateData, setUpdateData] = useState({});

	useEffect(() => {
		document.title = "Task Management | Users";
		if (!users || users.length === 0) {
			fetchData();
		}
	}, []);
	useEffect(() => {
		if (!isOpen) setUpdateData({});
	}, [isOpen]);

	const fetchData = async () => {
		setUsersLoading(true);
		try {
			const userResponse = await axiosClient.get(API().user());
			setUsers(userResponse.data.data);
			// To load task assignees option when users are fetched
			setOptions(userResponse?.data?.data?.map((user) => ({ value: user.id, label: user.name })));
		} catch (e) {
			if (e.message !== "Request aborted") console.error("Error fetching data:", e.message);
		} finally {
			setUsersLoading(false);
		}
	};

	return (
		<div className="w-screen md:w-full bg-card text-card-foreground border border-border rounded-2xl container p-4 md:p-10 shadow-md">
			<div>
				<h1 className=" font-extrabold text-3xl">Members of {user?.data?.organization?.name}</h1>
				<p>List of all organization members</p>
			</div>

			{(() => {
				const { columns: userColumns, dialog } = columns({ fetchData, setIsOpen, setUpdateData, updateData });
				return (
					<>
						<DataTable columns={userColumns} isOpen={isOpen} setIsOpen={setIsOpen} updateData={updateData} setUpdateData={setUpdateData} />
						{dialog}
					</>
				);
			})()}
		</div>
	);
}
