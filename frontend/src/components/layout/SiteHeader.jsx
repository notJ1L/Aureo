import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCartCount } from "../../hooks/useCartCount";
import { IconBag, IconHeart, IconMenu } from "./icons";
import "./site.css";

const NAV_ITEMS = [
    { to: "/catalog", label: "Collection" },
    { to: "/services", label: "Services" },
    { to: "/sell", label: "Sell a watch" },
    { to: "/appraisals", label: "Appraisals" }
];

/**
 * The storefront header.
 *
 * `variant="overlay"` floats over the home hero and turns into frosted glass
 * once the page scrolls. `variant="solid"` is sticky and used everywhere else.
 */
export function SiteHeader({ variant = "solid" }) {
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const cartCount = useCartCount();

    const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const closeMenu = () => setMenuOpen(false);
    const firstName = user?.name ? user.name.split(" ")[0] : "Account";
    const initials = user?.name
        ? user.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
        : "A";

    const classes = [
        "site-header",
        `site-header--${variant}`,
        scrolled ? "is-scrolled" : "",
        menuOpen ? "is-open" : ""
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <header className={classes}>
            <div className="site-header__inner">
                <Link to="/" className="site-logo" aria-label="Aureo home" onClick={closeMenu}>
                    <span className="site-logo__mark" aria-hidden="true" />
                    AUREO
                </Link>

                <nav className="site-nav" aria-label="Primary">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={closeMenu}
                            className={({ isActive }) => `site-nav__link ${isActive ? "is-active" : ""}`}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                    {isAuthenticated && (
                        <NavLink
                            to="/orders"
                            onClick={closeMenu}
                            className={({ isActive }) => `site-nav__link ${isActive ? "is-active" : ""}`}
                        >
                            Orders
                        </NavLink>
                    )}
                    {user?.role === "admin" && (
                        <NavLink to="/admin/dashboard" onClick={closeMenu} className="site-nav__link site-nav__link--admin">
                            Admin vault
                        </NavLink>
                    )}
                </nav>

                <div className="site-actions">
                    <Link to="/wishlist" className="site-icon-btn" aria-label="Wishlist" id="header-wishlist">
                        <IconHeart />
                    </Link>

                    {isAuthenticated ? (
                        <Link to="/me" className="site-account" id="header-account">
                            {user?.avatar?.url ? (
                                <img src={user.avatar.url} alt="" className="site-account__avatar" />
                            ) : (
                                <span className="site-account__avatar site-account__avatar--initials">{initials}</span>
                            )}
                            <span className="site-account__name">{firstName}</span>
                        </Link>
                    ) : (
                        <Link to="/login" className="site-account site-account--signin" id="header-signin">
                            Sign in
                        </Link>
                    )}

                    <Link to="/cart" className="site-bag" aria-label={`Shopping bag, ${cartCount} items`} id="header-bag">
                        <IconBag />
                        <span className="site-bag__count">{cartCount}</span>
                    </Link>

                    <button
                        type="button"
                        className="site-burger"
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

export default SiteHeader;
