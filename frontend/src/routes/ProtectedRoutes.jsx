import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

/** Redirects to /login if not authenticated */
export function PrivateRoute({ children }) {
    const { isAuthenticated, loading } = useSelector((s) => s.auth);
    if (loading) return null; // wait for loadUser to resolve
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/** Redirects to / if not an admin */
export function AdminRoute({ children }) {
    const { isAuthenticated, loading, user } = useSelector((s) => s.auth);
    if (loading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== "admin") return <Navigate to="/" replace />;
    return children;
}
