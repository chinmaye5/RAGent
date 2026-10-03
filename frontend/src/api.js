import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://ragentv2.onrender.com";

const api = axios.create({
    baseURL: API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`
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