import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Without the env var a deployed build silently points at localhost and every
// request fails with no obvious cause — say so loudly instead.
if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
        console.error(
            "NEXT_PUBLIC_API_URL is not set — API calls are falling back to " +
            "http://localhost:8000 and will fail. Set it in the Vercel project's " +
            "environment variables and redeploy."
        );
    }
}

const api = axios.create({ baseURL: API_BASE });

// Attach token automatically
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("crm_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err.response?.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("crm_token");
            localStorage.removeItem("crm_user");
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

export default api;
