import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useCartCount } from "../../hooks/useCartCount";
import { useTheme } from "../ui/AureoProvider";
import api from "../../services/api";
import { IconBag, IconHeart, IconMenu, IconMoon, IconSearch, IconSun } from "./icons";
import "./site.css";

const NAV_ITEMS = [
    { to: "/catalog", label: "Collection" },
    { to: "/services", label: "Services" },
    { to: "/sell", label: "Sell" },
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
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [scrolled, setScrolled] = useState(() => window.scrollY > 24);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 24);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const closeMenu = () => setMenuOpen(false);

    useEffect(() => {
        if (searchOpen) {
            searchInputRef.current?.focus();
        }
    }, [searchOpen]);

    useEffect(() => {
        const handleOutsideSearchClick = (event) => {
            if (!searchRef.current?.contains(event.target)) {
                setSearchOpen(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideSearchClick);
        return () => document.removeEventListener("mousedown", handleOutsideSearchClick);
    }, []);

    useEffect(() => {
        const query = searchQuery.trim();
        if (!searchOpen || query.length < 2) {
            setSuggestions([]);
            setSearchLoading(false);
            return undefined;
        }

        let cancelled = false;
        setSearchLoading(true);
        const timer = window.setTimeout(async () => {
            try {
                const { data } = await api.get("/products", {
                    params: { keyword: query, limit: 5 }
                });
                if (!cancelled) {
                    setSuggestions(data.products || []);
                }
            } catch {
                if (!cancelled) {
                    setSuggestions([]);
                }
            } finally {
                if (!cancelled) {
                    setSearchLoading(false);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [searchOpen, searchQuery]);

    const handleSearchKeyDown = (event) => {
        if (event.key === "Escape") {
            setSearchOpen(false);
            return;
        }

        if (event.key === "Enter" && searchQuery.trim()) {
            navigate(`/catalog?keyword=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
        }
    };

    const handleSuggestionClick = (product) => {
        navigate(`/product/${product._id}`);
        setSearchOpen(false);
    };
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
                            Admin
                        </NavLink>
                    )}
                </nav>

                <div className="site-actions">
                    <div
                        ref={searchRef}
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem"
                        }}
                    >
                        <button
                            type="button"
                            className="site-icon-btn"
                            aria-label={searchOpen ? "Close search" : "Search watches"}
                            aria-expanded={searchOpen}
                            onClick={() => setSearchOpen((open) => !open)}
                        >
                            <IconSearch />
                        </button>
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search watches..."
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            aria-label="Search watches"
                            style={{
                                width: searchOpen ? "220px" : "0",
                                maxWidth: "min(220px, 42vw)",
                                opacity: searchOpen ? 1 : 0,
                                padding: searchOpen ? "0.45rem 0.2rem" : 0,
                                border: 0,
                                borderBottom: searchOpen ? "1px solid var(--gold)" : "1px solid transparent",
                                outline: "none",
                                color: "var(--text-primary, var(--text))",
                                background: "transparent",
                                transition: "width 0.3s ease, opacity 0.3s ease, padding 0.3s ease",
                                pointerEvents: searchOpen ? "auto" : "none"
                            }}
                        />
                        {searchOpen && searchQuery.trim().length >= 2 && (
                            <div
                                role="listbox"
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 0.5rem)",
                                    right: 0,
                                    width: "min(280px, calc(100vw - 32px))",
                                    maxWidth: "280px",
                                    overflow: "hidden",
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "8px",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                                    zIndex: 1000
                                }}
                            >
                                {searchLoading ? (
                                    <div style={{ padding: "10px 14px", color: "var(--text-muted)" }}>
                                        Searching...
                                    </div>
                                ) : suggestions.length > 0 ? (
                                    suggestions.map((product) => (
                                        <button
                                            key={product._id}
                                            type="button"
                                            role="option"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => handleSuggestionClick(product)}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                padding: "10px 14px",
                                                border: 0,
                                                borderBottom: "1px solid var(--border)",
                                                textAlign: "left",
                                                color: "var(--text-primary, var(--text))",
                                                background: "transparent",
                                                cursor: "pointer"
                                            }}
                                            onMouseEnter={(event) => {
                                                event.currentTarget.style.background = "rgba(212,175,55,0.08)";
                                            }}
                                            onMouseLeave={(event) => {
                                                event.currentTarget.style.background = "transparent";
                                            }}
                                        >
                                            <span style={{ display: "block", fontSize: "0.9rem" }}>{product.name}</span>
                                            <span style={{ display: "block", marginTop: "0.2rem", color: "var(--gold)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                                                {product.brand}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div style={{ padding: "10px 14px", color: "var(--text-muted)" }}>
                                        No watches found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="site-icon-btn site-theme-toggle"
                        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        title={theme === "dark" ? "Light mode" : "Dark mode"}
                        onClick={toggleTheme}
                    >
                        {theme === "dark" ? <IconSun /> : <IconMoon />}
                    </button>

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
