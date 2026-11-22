import axios from "axios";
import { obterToken } from "../utils/sessao.js";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL?.trim() || "http://localhost:3001",
    timeout: 10000,
    headers: { Accept: "application/json" },
});

api.interceptors.request.use(config => {
    const token = obterToken();
    if (token && !config.semAutenticacao) {
        config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
});

export default api;
