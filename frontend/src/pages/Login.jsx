import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../axios.client";
import { useAuthContext } from "../contexts/AuthContextProvider";
import { Loader2, Sun, Moon } from "lucide-react";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { API } from "@/constants/api";
import { useToast } from "@/contexts/ToastContextProvider";

export default function Login() {
	const { loading, setLoading } = useLoadContext();
	const showToast = useToast();
	const [errors, setErrors] = useState(null);
	const { setUser, setToken } = useAuthContext();
	const emailRef = useRef();
	const passwordRef = useRef();
	const canvasRef = useRef(null);

	// Track theme (dark/light) by observing <html> class changes
	const [theme, setTheme] = useState(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));

	useEffect(() => {
		document.title = "Task Management | Log In";
	}, []);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			const isDark = document.documentElement.classList.contains("dark");
			setTheme(isDark ? "dark" : "light");
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	const onsubmit = (e) => {
		setLoading(true);
		e.preventDefault();
		const payload = {
			email: emailRef.current.value,
			password: passwordRef.current.value,
		};
		axiosClient
			.post(API().login, payload)
			.then(({ data }) => {
				if (data.user.status == "pending") {
					showToast("Login Failed", "Your request has not been approved yet.", 10000, "warning");
				} else if (data.user.status == "rejected") {
					showToast("Login Failed", "Your request to join has been rejected by the organization.", 10000, "fail");
				} else if (data.user.status == "inactive") {
					showToast("Login Failed", "Your account is no longer active. Ask your organization to reactivate it.", 10000, "warning");
				} else if (data.user.status == "banned") {
					showToast("Login Failed", "Your account has been banned from this organization.", 10000, "fail");
				} else {
					setUser(data.user);
					setToken(data.token);
				}
				setLoading(false);
			})
			.catch((err) => {
				const response = err.response;
				if (response && response.status === 422) {
					if (response.data.errors) {
						setErrors(response.data.errors);
					} else {
						setErrors({
							email: [response.data.message],
						});
					}
				} else {
					console.log(response);
				}
				setLoading(false);
			});
	};

	return (
		<div className="inset-0 flex items-center justify-center min-h-screen overflow-hidden">
			<div className="relative z-10 w-full max-w-md mx-4">
				<div
					className={`backdrop-blur-md ${
						theme === "dark" ? "bg-black/20 border-white/10" : "bg-white/80 border-gray-200/50"
					} border rounded-2xl p-8 shadow-2xl`}
				>
					<div className="text-center mb-8">
						<h1 className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Welcome Back</h1>
						<p className={`${theme === "dark" ? "text-purple-200" : "text-gray-600"}`}>Sign in to your account</p>
					</div>

					<div
						className={`${
							theme === "dark" ? "bg-purple-900/30 border-purple-500/20" : "bg-purple-50/80 border-purple-200/50"
						} backdrop-blur-sm rounded-lg p-4 mb-6 border`}
					>
						<div className={`${theme === "dark" ? "text-purple-200" : "text-purple-700"} text-center`}>
							<p className="mb-1">Demo Credentials</p>
							<div className="flex flex-row justify-evenly text-xs">
								<div className="text-center">
									<h1 className="font-bold">Manager</h1>
									<p className={`${theme === "dark" ? "text-purple-100" : "text-purple-800"}`}>manager@demo.com</p>
									<p className={`${theme === "dark" ? "text-purple-100" : "text-purple-800"}`}>admin123</p>
								</div>
								<div className="text-center">
									<h1 className="font-bold">Employee</h1>
									<p className={`${theme === "dark" ? "text-purple-100" : "text-purple-800"}`}>employee@demo.com</p>
									<p className={`${theme === "dark" ? "text-purple-100" : "text-purple-800"}`}>admin123</p>
								</div>
							</div>
						</div>
					</div>

					{errors && (
						<div
							className={`${
								theme === "dark" ? "bg-red-900/30 border-red-500/30" : "bg-red-50/80 border-red-200/50"
							} backdrop-blur-sm border rounded-lg p-3 mb-4`}
						>
							<div className={`${theme === "dark" ? "text-red-200" : "text-red-700"} text-sm space-y-1`}>
								{Object.keys(errors).map((key) => (
									<p key={key}>{errors[key][0]}</p>
								))}
							</div>
						</div>
					)}

					<form onSubmit={onsubmit} className="space-y-4">
						<div>
							<input
								ref={emailRef}
								type="email"
								placeholder="Email"
								defaultValue="manager@demo.com"
								className={`w-full px-4 py-3 ${
									theme === "dark"
										? "bg-black/20 border-white/10 text-white placeholder-purple-300"
										: "bg-white/60 border-gray-200/50 text-gray-800 placeholder-gray-500"
								} backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300`}
								required
							/>
						</div>
						<div>
							<input
								ref={passwordRef}
								type="password"
								placeholder="Password"
								defaultValue="admin123"
								className={`w-full px-4 py-3 ${
									theme === "dark"
										? "bg-black/20 border-white/10 text-white placeholder-purple-300"
										: "bg-white/60 border-gray-200/50 text-gray-800 placeholder-gray-500"
								} backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300`}
								required
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading && <Loader2 className="animate-spin h-5 w-5" />}
							{loading ? "Signing in..." : "Sign In"}
						</button>
					</form>

					<div className="text-center mt-6">
						{!loading && (
							<p className={`${theme === "dark" ? "text-purple-200" : "text-gray-600"}`}>
								Don't have an account?{" "}
								<Link
									to="/signup"
									className={`${
										theme === "dark" ? "text-purple-300 hover:text-white" : "text-purple-600 hover:text-purple-700"
									} font-medium transition-colors duration-300`}
								>
									Sign up here
								</Link>
							</p>
						)}
					</div>
				</div>
				<div className="mt-10 text-muted-foreground text-center">© 2025 Dominic Escoto. All rights reserved.</div>
			</div>
		</div>
	);
}
