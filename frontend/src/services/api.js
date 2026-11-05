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

let isTerminatingSession = false;

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response ? error.response.status : null;
        const message = error.response?.data?.message || "";
        const isDeactivated = message.toLowerCase().includes("deactivated");

        // If the request fails due to 401 (token expired/invalid/deactivated)
        // or 403 (explicit account deactivation), force immediate session termination.
        if (status === 401 || (status === 403 && isDeactivated)) {
            const token = localStorage.getItem("aureoToken");

            if (token && !isTerminatingSession) {
                isTerminatingSession = true;
                localStorage.removeItem("aureoToken");
                localStorage.removeItem("aureoUser");

                // Dispatch global event caught by SessionMonitor to alert and redirect
                window.dispatchEvent(
                    new CustomEvent("aureo:session-terminated", {
                        detail: {
                            isDeactivated,
                            message: isDeactivated
                                ? "Your account has been deactivated by an administrator. You have been forcibly signed out."
                                : (message || "Your session has expired. Please sign in again.")
                        }
                    })
                );

                setTimeout(() => {
                    isTerminatingSession = false;
                }, 4000);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
