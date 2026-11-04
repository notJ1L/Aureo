import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "../ui/AureoProvider";
import {
    IconBox,
    IconChat,
    IconGrid,
    IconReceipt,
    IconScale,
    IconStore,
    IconTool,
    IconUser,
    IconMenu,
    IconMoon,
    IconSun,
    IconStar
} from "./icons";
import "../../styles/admin.css";

const ADMIN_LINKS = [
    { to: "/admin/dashboard", label: "Dashboard", icon: IconGrid },
    { to: "/admin/products", label: "Inventory", icon: IconBox },
    { to: "/admin/orders", label: "Orders", icon: IconReceipt },
    { to: "/admin/reviews", label: "Reviews", icon: IconStar },
    { to: "/admin/services", label: "Services", icon: IconTool },
    { to: "/admin/appraisals", label: "Appraisals", icon: IconScale },
    { to: "/admin/tickets", label: "Tickets", icon: IconChat },
    { to: "/admin/users", label: "Users", icon: IconUser }
];

export function AdminHeader() {
    const { user } = useSelector((state) => state.auth);
    const { theme, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => setMenuOpen(false);

    return (
        <header className={`admin-vault-header ${menuOpen ? "is-open" : ""}`}>
            <div className="admin-vault-header__inner">
                <div className="admin-vault-header__brand">
                    <Link to="/" className="site-logo" onClick={closeMenu}>
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
                                onClick={closeMenu}
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
                    <button
                        type="button"
                        className="admin-theme-toggle"
                        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        title={theme === "dark" ? "Light mode" : "Dark mode"}
                        onClick={toggleTheme}
                    >
                        {theme === "dark" ? <IconSun /> : <IconMoon />}
                    </button>

                    <Link to="/" className="admin-quick-btn" title="View Public Storefront" onClick={closeMenu}>
                        <IconStore /> <span>Storefront</span>
                    </Link>
                    <Link to="/me" className="admin-user-pill" title="Administrator Profile" onClick={closeMenu}>
                        {user?.avatar?.url ? (
                            <img src={user.avatar.url} alt="" className="admin-user-avatar" />
                        ) : (
                            <span className="admin-user-avatar admin-user-avatar--initials">
                                {user?.name?.[0]?.toUpperCase() || "A"}
                            </span>
                        )}
                        <span className="admin-user-name">{user?.name ? user.name.split(" ")[0] : "Admin"}</span>
                    </Link>

                    <button
                        type="button"
                        className="admin-burger"
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <IconMenu />
                    </button>
                </div>
            </div>
        </header>
    );
}

export default AdminHeader;
