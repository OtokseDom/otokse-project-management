import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE_URL ?? "";
// Normalize: "" (same-origin) and "/" both resolve to /api; "https://host" and
// "https://host/" both resolve to https://host/api. Without this, a "/" value
// would produce a broken "//api" baseURL.
const normalizedBase = rawBase.replace(/\/+$/, "");
const axiosClient = axios.create({
	// where port is running via .env (.env.production is empty = same origin)
	baseURL: `${normalizedBase}/api`,
});

// interceptors executed before request is sent or after response is received
// Request Interceptor
// Checks if the user is authorized before proceeding
axiosClient.interceptors.request.use((config) => {
	const token = localStorage.getItem("ACCESS_TOKEN");
	config.headers.Authorization = `Bearer ${token}`;
	return config;
});

// Response Inteceptor
// 2 params: when resolved or when rejected
axiosClient.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		const { response } = error;
		if (response?.status === 401) {
			// if user is unauthorize, token invalid, token expired
			localStorage.removeItem("ACCESS_TOKEN");
			window.location.href = "/login"; // force redirect to login page
		}
		return Promise.reject(error);

		// throw error;
	}
);

export default axiosClient;
