import React from "react";
import "./index.css";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./Router";
import { AuthContextProvider } from "./contexts/AuthContextProvider";
import { ThemeProvider } from "@material-tailwind/react";
import { SidebarContextProvider } from "./contexts/SidebarContextProvider";
import { ScrollContextProvider } from "./contexts/ScrollContextProvider";
import { ToastProvider } from "@radix-ui/react-toast";
import { ToastContextProvider } from "./contexts/ToastContextProvider";
import { LoadContextProvider } from "./contexts/LoadContextProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
	// Strict mode rerenders everything twice to detect side effects
	<React.StrictMode>
		<AuthContextProvider>
			<SidebarContextProvider>
				<ToastProvider swipeDirection="right">
					<ToastContextProvider>
						<ScrollContextProvider>
							<LoadContextProvider>
								<ThemeProvider>
									<RouterProvider router={router} />
								</ThemeProvider>
							</LoadContextProvider>
						</ScrollContextProvider>
					</ToastContextProvider>
				</ToastProvider>
			</SidebarContextProvider>
		</AuthContextProvider>
	</React.StrictMode>
);
