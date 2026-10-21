import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:3000/api/v1",
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("aureoToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Multipart uploads must not carry an explicit Content-Type, the
        // browser adds the multipart boundary itself.
        if (typeof FormData !== "undefined" && config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
