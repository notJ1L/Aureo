import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { AUTH_LOGOUT } from "../../redux/constants/authConstants";
import { showSessionAlert } from "../../utils/sweetAlert";

/**
 * SessionMonitor
 * Runs active session polling, tab focus checks, and listens for global
 * session termination events. Forcibly logs out deactivated accounts in real time.
 */
export default function SessionMonitor() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const isAlertingRef = useRef(false);

    // 1. Listen for global session-terminated events from the API interceptor
    useEffect(() => {
        const handleSessionTerminated = async (event) => {
            if (isAlertingRef.current) return;
            isAlertingRef.current = true;

            // Clear Redux state & storage immediately
            dispatch({ type: AUTH_LOGOUT });
            localStorage.removeItem("aureoToken");
            localStorage.removeItem("aureoUser");

            const detail = event.detail || {};
            const title = detail.isDeactivated ? "Account Deactivated" : "Session Expired";
            const message = detail.message || "Your session has ended. Please sign in again.";

            await showSessionAlert(title, message);
            isAlertingRef.current = false;
            navigate("/login", { replace: true });
        };

        window.addEventListener("aureo:session-terminated", handleSessionTerminated);
        return () => {
            window.removeEventListener("aureo:session-terminated", handleSessionTerminated);
        };
    }, [dispatch, navigate]);

    // 2. Real-time active session validation (polling, navigation, and window focus)
    useEffect(() => {
        const token = localStorage.getItem("aureoToken");
        if (!token && !isAuthenticated) return;

        let isChecking = false;

        const checkSessionState = async () => {
            if (isChecking || isAlertingRef.current) return;
            const currentToken = localStorage.getItem("aureoToken");
            if (!currentToken) return;

            isChecking = true;
            try {
                const { data } = await api.get("/me");
                if (data.user && data.user.isActive === false) {
                    window.dispatchEvent(
                        new CustomEvent("aureo:session-terminated", {
                            detail: {
                                isDeactivated: true,
                                message: "Your account has been deactivated by an administrator. You have been forcibly signed out."
                            }
                        })
                    );
                }
            } catch {
                // api response interceptor will catch 401/403 and dispatch aureo:session-terminated
            } finally {
                isChecking = false;
            }
        };

        const handleFocus = () => {
            checkSessionState();
        };

        // Poll every 6 seconds while authenticated
        const pollTimer = setInterval(checkSessionState, 6000);
        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleFocus);

        // Run check immediately on route change
        checkSessionState();

        return () => {
            clearInterval(pollTimer);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleFocus);
        };
    }, [location.pathname, isAuthenticated]);

    return null;
}

