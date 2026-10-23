import { Link, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    IconBox,
    IconChat,
    IconGrid,
    IconReceipt,
    IconScale,
    IconStore,
    IconTool,
    IconUser
} from "./icons";
import "../../styles/admin.css";

const ADMIN_LINKS = [
    { to: "/admin/dashboard", label: "Dashboard", icon: IconGrid },
    { to: "/admin/products", label: "Inventory", icon: IconBox },
    { to: "/admin/orders", label: "Orders", icon: IconReceipt },
    { to: "/admin/services", label: "Services", icon: IconTool },
    { to: "/admin/appraisals", label: "Appraisals", icon: IconScale },
    { to: "/admin/tickets", label: "Tickets", icon: IconChat }
];

export function AdminHeader() {
    const { user } = useSelector((state) => state.auth);

    return (
        <header className="admin-vault-header">
            <div className="admin-vault-header__inner">
                <div className="admin-vault-header__brand">
                    <Link to="/" className="site-logo">
                        <span className="site-logo__mark" aria-hidden="true" />
                        AUREO
                    </Link>
                    <span className="admin-vault-badge">VAULT HQ</span>
                </div>

                <nav className="admin-vault-nav" aria-label="Admin Navigation">
                    {ADMIN_LINKS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `admin-nav-item ${isActive ? "is-active" : ""}`
                                }
                            >
                                <Icon />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="admin-vault-actions">
                    <Link to="/catalog" className="admin-quick-btn" title="View Public Storefront">
                        <IconStore /> <span>Storefront</span>
                    </Link>
                    <Link to="/me" className="admin-user-pill" title="Administrator Profile">
                        {user?.avatar?.url ? (
                            <img src={user.avatar.url} alt="" className="admin-user-avatar" />
                        ) : (
                            <span className="admin-user-avatar admin-user-avatar--initials">
                                {user?.name?.[0]?.toUpperCase() || "A"}
                            </span>
                        )}
                        <span className="admin-user-name">{user?.name ? user.name.split(" ")[0] : "Admin"}</span>
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default AdminHeader;
