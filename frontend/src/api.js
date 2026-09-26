import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/"
});

api.interceptors.request.use((config) => {
    // Skip adding Authorization header for login/register endpoints
    const isAuthEndpoint = config.url?.startsWith("/auth/login") || config.url?.startsWith("/auth/register");
    if (!isAuthEndpoint) {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;