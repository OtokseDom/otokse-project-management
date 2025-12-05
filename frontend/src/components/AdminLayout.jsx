import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContextProvider";
import axiosClient from "../axios.client";
import { useSidebarContext } from "@/contexts/SidebarContextProvider";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { API } from "@/constants/api";

export default function AdminLayout() {
	const { user, token, setToken, setUser } = useAuthContext();
	const { expanded } = useSidebarContext();
	// Login Authentication
	if (!token || !user) {
		return <Navigate to={"/login"} />;
	}

	useEffect(() => {
		axiosClient.get(API().user_auth).then(({ data }) => {
			setUser(data);
		});
	}, []);

	useEffect(() => {
		sessionStorage.setItem("expanded", JSON.stringify(expanded));
	}, [expanded]);

	return (
		<SidebarProvider defaultOpen={expanded} className="flex min-h-[100dvh] w-full">
			<AppSidebar />
			<SidebarTrigger className="block md:hidden fixed" />
			<main className="flex w-screen flex-col items-center justify-between p-12">
				<Outlet />
				<div className="pt-5 text-muted-foreground">© 2025 Dominic Escoto. All rights reserved.</div>
			</main>
		</SidebarProvider>
	);
}
