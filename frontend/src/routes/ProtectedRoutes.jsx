import { useSelector } from "react-redux";
import { Navigate, Link } from "react-router-dom";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

/**
 * Unverified account banner / card shown when a route requires an email-verified account.
 */
export function UnverifiedNotice({ user }) {
    return (
        <main className="sell-page">
            <SiteHeader variant="solid" />
            <div className="sell-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="auth-card" style={{ maxWidth: "520px", margin: "3rem auto", textAlign: "center" }}>
                    <p className="eyebrow" style={{ color: "var(--danger)" }}>SECURITY PROTOCOL</p>
                    <h1 style={{ fontSize: "1.8rem", margin: "0.5rem 0 1rem" }}>Please Verify Your Email</h1>
                    <p className="auth-description">
                        Your account <strong>{user?.email}</strong> must be verified before accessing this feature (Aureo Vault Protocol). Please check your inbox for the 6-digit confirmation code.
                    </p>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.8rem", flexWrap: "wrap" }}>
                        <Link to="/register" className="gold-button">
                            Enter Verification Code
                        </Link>
                        <Link to="/me" className="outline-button">
                            Account Profile
                        </Link>
                    </div>
                </div>
            </div>
            <SiteFooter />
        </main>
    );
}

/** Redirects to /login if not authenticated; optionally requires verified email */
export function PrivateRoute({ children, requireVerified = false }) {
    const { isAuthenticated, loading, user } = useSelector((s) => s.auth);
    if (loading) return null; // wait for loadUser to resolve
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (requireVerified && user && user.isVerified === false) {
        return <UnverifiedNotice user={user} />;
    }

    return children;
}

/** Redirects to /login if not authenticated; shows verification screen if unverified */
export function VerifiedRoute({ children }) {
    return <PrivateRoute requireVerified={true}>{children}</PrivateRoute>;
}

/** Redirects to / if not an admin */
export function AdminRoute({ children }) {
    const { isAuthenticated, loading, user } = useSelector((s) => s.auth);
    if (loading) return null;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== "admin") return <Navigate to="/" replace />;
    return children;
}
