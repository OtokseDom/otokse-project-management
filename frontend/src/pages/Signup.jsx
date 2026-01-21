import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContextProvider";
import axiosClient from "../axios.client";
import { Loader2 } from "lucide-react";
import { useLoadContext } from "@/contexts/LoadContextProvider";
import { API } from "@/constants/api";
import { useToast } from "@/contexts/ToastContextProvider";

export default function Signup() {
	const { loading, setLoading } = useLoadContext();
	const [errors, setErrors] = useState(null);
	const { setUser, setToken } = useAuthContext();
	const showToast = useToast();
	const navigate = useNavigate();

	const [hasOrgCode, setHasOrgCode] = useState(true);
	const orgCodeRef = useRef();
	const orgNameRef = useRef();
	const nameRef = useRef();
	const emailRef = useRef();
	const positionRef = useRef();
	const dobRef = useRef();
	const passwordRef = useRef();
	const passwordConfiramtionRef = useRef();

	// Track theme (dark/light) by observing <html> class changes
	const [theme, setTheme] = useState(() => (document.documentElement.classList.contains("dark") ? "dark" : "light"));

	useEffect(() => {
		document.title = "Task Management | Sign Up";
	}, []);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			const isDark = document.documentElement.classList.contains("dark");
			setTheme(isDark ? "dark" : "light");
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);
	const onSubmit = (e) => {
		setLoading(true);
		e.preventDefault();
		const payload = {
			name: nameRef.current.value,
			role: "Employee",
			email: emailRef.current.value,
			position: positionRef.current.value,
			dob: dobRef.current.value,
			password: passwordRef.current.value,
			password_confirmation: passwordConfiramtionRef.current.value,
		};
		if (hasOrgCode) {
			payload.organization_code = orgCodeRef.current.value;
		} else {
			payload.organization_name = orgNameRef.current.value;
			payload.role = "Superadmin";
		}
		axiosClient
			.post(API().signup, payload)
			.then(({ data }) => {
				if (!hasOrgCode) {
					setUser(data.data.user);
					setToken(data.data.token);
				} else {
					showToast("Account Successfully Created", "Wait for your organization's approval and try to login.", 10000);
					navigate(`/login`);
				}
				setLoading(false);
			})
			.catch((err) => {
				const response = err.response;
				if (response && response.status === 422) {
					setErrors(response.data.errors);
				} else {
					setErrors(response.data.errors);
				}
				setLoading(false);
			});
	};

	return (
		<div className="inset-0 flex items-center justify-center min-h-screen overflow-auto py-8">
			<div className="w-full max-w-md mx-4">
				<div
					className={`backdrop-blur-md ${
						theme === "dark" ? "bg-black/20 border-white/10" : "bg-white/80 border-gray-200/50"
					} border rounded-2xl p-8 shadow-2xl`}
				>
					<div className="text-center mb-6">
						<h1 className={`text-3xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Create Account</h1>
						<p className={`${theme === "dark" ? "text-purple-200" : "text-gray-600"}`}>Join our platform today</p>
					</div>

					{errors && (
						<div className="bg-red-900/30  border border-red-500/30 rounded-lg p-3 mb-4">
							<div className="text-red-200 text-sm space-y-1">
								{Object.keys(errors).map((field) => errors[field].map((msg, index) => <p key={`${field}-${index}`}>{msg}</p>))}
							</div>
						</div>
					)}

					<form onSubmit={onSubmit} className="space-y-4">
						<div className="border-b-2">
							<div className="flex flex-col gap-2 mb-6">
								<label className="flex flex-row w-full gap-4 cursor-pointer">
									<input className="w-fit my-auto" type="radio" name="orgOption" checked={hasOrgCode} onChange={() => setHasOrgCode(true)} />
									<span className={`${theme === "dark" ? "text-purple-200" : "text-gray-700"} w-full`}>Join Organization</span>
								</label>
								<label className="flex  flex-row w-full gap-4 cursor-pointer">
									<input
										className="w-fit my-auto"
										type="radio"
										name="orgOption"
										checked={!hasOrgCode}
										onChange={() => setHasOrgCode(false)}
									/>
									<span className={`${theme === "dark" ? "text-purple-200" : "text-gray-700"} w-full`}>Create Organization</span>
								</label>
							</div>
							<label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-purple-200" : "text-gray-700"}`}>
								{hasOrgCode ? "Organization Code" : "Organization Name"}
							</label>
							{hasOrgCode ? (
								<input
									ref={orgCodeRef}
									type="text"
									placeholder="Enter code to join existing organization"
									className={`w-full px-4 py-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 ${
										theme === "dark"
											? "bg-black/20 border-white/10 text-white placeholder-purple-300"
											: "bg-white/20 border-gray-300/30 text-gray-800 placeholder-gray-500"
									}`}
									required
								/>
							) : (
								<input
									ref={orgNameRef}
									type="text"
									placeholder="Enter new organization name"
									className={`w-full px-4 py-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 ${
										theme === "dark"
											? "bg-black/20 border-white/10 text-white placeholder-purple-300"
											: "bg-white/20 border-gray-300/30 text-gray-800 placeholder-gray-500"
									}`}
									required
								/>
							)}
						</div>

						<div className="grid grid-cols-1 gap-4">
							<input
								ref={nameRef}
								type="text"
								placeholder="Full Name"
								className={`w-full px-4 py-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 ${
									theme === "dark"
										? "bg-black/20 border-white/10 text-white placeholder-purple-300"
										: "bg-white/20 border-gray-300/30 text-gray-800 placeholder-gray-500"
								}`}
								required
							/>
							<input
								ref={emailRef}
								type="email"
								placeholder="Email Address"
								className={`w-full px-4 py-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 ${
									theme === "dark"
										? "bg-black/20 border-white/10 text-white placeholder-purple-300"
										: "bg-white/20 border-gray-300/30 text-gray-800 placeholder-gray-500"
								}`}
								required
							/>
							<input
								ref={positionRef}
								type="text"
								placeholder="Job Position"
								className={`w-full px-4 py-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 ${
									theme === "dark"
										? "bg-black/20 border-white/10 text-white placeholder-purple-300"
										: "bg-white/20 border-gray-300/30 text-gray-800 placeholder-gray-500"
								}`}
								required
							/>
							<input
								ref={dobRef}
								type="date"
								placeholder="Date of Birth"
								className={`w-full px-4 py-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 ${
									theme === "dark"
										? "bg-black/20 border-white/10 text-white placeholder-purple-300"
										: "bg-white/20 border-gray-300/30 text-gray-800 placeholder-gray-500"
								}`}
								required
							/>
							<input
								ref={passwordRef}
								type="password"
								placeholder="Password"
								className={`w-full px-4 py-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 ${
									theme === "dark"
										? "bg-black/20 border-white/10 text-white placeholder-purple-300"
										: "bg-white/20 border-gray-300/30 text-gray-800 placeholder-gray-500"
								}`}
								required
							/>
							<input
								ref={passwordConfiramtionRef}
								type="password"
								placeholder="Confirm Password"
								className={`w-full px-4 py-3  border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 ${
									theme === "dark"
										? "bg-black/20 border-white/10 text-white placeholder-purple-300"
										: "bg-white/20 border-gray-300/30 text-gray-800 placeholder-gray-500"
								}`}
								required
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading && <Loader2 className="animate-spin h-5 w-5" />}
							{loading ? "Creating Account..." : "Create Account"}
						</button>
					</form>

					<div className="text-center mt-6">
						{!loading && (
							<p className={`${theme === "dark" ? "text-purple-200" : "text-gray-600"}`}>
								Already have an account?{" "}
								<Link
									to={loading ? "#" : "/login"}
									className={`font-medium transition-colors duration-300 ${
										theme === "dark" ? "text-purple-300 hover:text-white" : "text-purple-600 hover:text-purple-800"
									}`}
								>
									Sign In
								</Link>
							</p>
						)}
					</div>
				</div>
				<div className="mt-5 text-muted-foreground text-center">© 2025 Dominic Escoto. All rights reserved.</div>
			</div>
		</div>
	);
}
