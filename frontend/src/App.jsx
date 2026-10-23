import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import CatalogPage from "./pages/CatalogPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import WishlistPage from "./pages/WishlistPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import SellWatchPage from "./pages/SellWatchPage";
import MyAppraisalsPage from "./pages/MyAppraisalsPage";
import ServicesPage from "./pages/ServicesPage";
import ChatWidget from "./components/ChatWidget";
import { getProducts } from "./redux/actions/productActions";
import { PrivateRoute, AdminRoute } from "./routes/ProtectedRoutes";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import "./App.css";

// Phase 11 / spec 3.2: the 3D hero is lazy loaded so Three.js never blocks
// the first paint and never blocks navigation.
const WatchHero = lazy(() => import("./components/three/WatchHero"));

// The admin pages carry the heavy dependencies (Recharts and the data
// tables), so they are split out of the main bundle as well.
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminAppraisalsPage = lazy(() => import("./pages/admin/AdminAppraisalsPage"));
const AdminServicesPage = lazy(() => import("./pages/admin/AdminServicesPage"));
const AdminTicketsPage = lazy(() => import("./pages/admin/AdminTicketsPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));

function RouteFallback() {
    return <div className="route-fallback">Loading the vault...</div>;
}

import { useRef } from "react";
import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";
import { useReveal } from "./hooks/useReveal";
import { IconArrow, IconScale, IconShield, IconSparkle, IconTool, IconWatch } from "./components/layout/icons";
import atelierImg from "./assets/atelier.jpg";
import "./styles/landing.css";

function StoreLanding() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const {
        products,
        pagination,
        loading: productsLoading,
        error: productsError
    } = useSelector((state) => state.productList);

    const [page, setPage] = useState(1);
    const [visibleProducts, setVisibleProducts] = useState([]);
    const [loadedPage, setLoadedPage] = useState(0);
    const [isInteractive3D, setIsInteractive3D] = useState(false);

    const stageRef = useRef(null);
    const progressRef = useRef(0);

    useReveal(visibleProducts.length);

    useEffect(() => {
        dispatch(getProducts({ page, limit: 8 }));
    }, [dispatch, page]);

    // Track scroll progress through the 3D stage
    useEffect(() => {
        const handleScroll = () => {
            if (!stageRef.current) return;
            const rect = stageRef.current.getBoundingClientRect();
            const scrollDistance = rect.height - window.innerHeight;
            if (scrollDistance <= 0) return;
            const p = Math.min(1, Math.max(0, -rect.top / scrollDistance));
            progressRef.current = p;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (products?.length && page !== loadedPage) {
        setLoadedPage(page);

        setVisibleProducts((previous) => {
            if (page === 1) {
                return products;
            }

            const known = new Set(previous.map((item) => item._id));
            const fresh = products.filter((item) => !known.has(item._id));

            return fresh.length ? [...previous, ...fresh] : previous;
        });
    }

    const totalPages = pagination?.totalPages || 1;
    const hasMore = page < totalPages;

    const loadMore = () => {
        if (productsLoading || !hasMore) {
            return;
        }

        setPage((current) => current + 1);
    };

    const sentinelRef = useInfiniteScroll({
        onLoadMore: loadMore,
        hasMore,
        loading: productsLoading
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <main className="storefront-luxury">
            <SiteHeader variant="overlay" />

            {/* ---------------------------------------------------------------- */}
            {/* 3D Showcase & Scroll Story Stage                                  */}
            {/* ---------------------------------------------------------------- */}
            <div ref={stageRef} className="stage-container" id="top">
                <div className="stage-pinned">
                    <Suspense fallback={<div className="hero-3d hero-3d-skeleton" aria-hidden="true" />}>
                        <WatchHero
                            progressRef={progressRef}
                            interactive={isInteractive3D}
                        />
                    </Suspense>

                    {/* Interactive 3D Control Pill */}
                    <div className="stage-control-bar">
                        <span className="stage-control-indicator">
                            {isInteractive3D ? "Free 3D Orbit Mode" : "Scroll Choreography"}
                        </span>
                        <button
                            type="button"
                            className={`stage-mode-btn ${!isInteractive3D ? "is-active" : ""}`}
                            onClick={() => setIsInteractive3D(false)}
                            title="Watch turns as you scroll through chapters"
                        >
                            Story Mode
                        </button>
                        <button
                            type="button"
                            className={`stage-mode-btn ${isInteractive3D ? "is-active" : ""}`}
                            onClick={() => setIsInteractive3D(true)}
                            title="Drag to rotate, scroll to zoom"
                        >
                            3D Orbit
                        </button>
                    </div>
                </div>

                {/* Narrative Scroll Chapters Overlay */}
                <div className="story-scroll-track">
                    {/* Chapter 0: Hero Intro */}
                    <section className="story-chapter story-chapter--left">
                        <div className="chapter-card hero-chapter-card" data-reveal>
                            <p className="lx-kicker">ARCHIVAL HOROLOGY · EST. 2026</p>
                            <h1>The Architecture of Perpetual Time.</h1>
                            <p>
                                A considered sanctuary of rare mechanical chronometers, certified
                                provenance, and dedicated aftercare for the pieces that anchor your legacy.
                            </p>

                            <div className="chapter-actions">
                                <a href="#collection" className="btn-gold">
                                    Explore Collection <IconArrow />
                                </a>
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={() => navigate("/sell")}
                                >
                                    Sell Your Watch
                                </button>
                            </div>

                            <div className="hero-trust-bar">
                                <span>18K Solid Gold</span>
                                <span>Automatic Chronometer</span>
                                <span>Verified Provenance</span>
                                <span>Worldwide Delivery</span>
                            </div>
                        </div>
                    </section>

                    {/* Chapter 1: The Dial */}
                    <section className="story-chapter story-chapter--right">
                        <div className="chapter-card" data-reveal>
                            <span className="chapter-number">Chapter 01</span>
                            <p className="lx-kicker">THE FACE OF MASTERY</p>
                            <h2>Sunburst Lacquer Dial.</h2>
                            <p>
                                Deep obsidian lacquer with an ultra-fine radial sunray finish, capturing
                                ambient light in warm golden streaks. Fitted with hand-applied 18K solid gold
                                dauphine indices inlaid with luminescence for peerless legibility.
                            </p>

                            <div className="chapter-specs-row">
                                <div className="chapter-spec-item">
                                    <span>Dial Finish</span>
                                    <strong>Radial Sunray Lacquer</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Indices</span>
                                    <strong>18K Gold Faceted Batons</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Calendar</span>
                                    <strong>Instantaneous Date at 3H</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Luminescence</span>
                                    <strong>Swiss Super-LumiNova</strong>
                                </div>
                            </div>

                            <div className="chapter-actions">
                                <button
                                    type="button"
                                    className="stage-mode-btn is-active"
                                    onClick={() => setIsInteractive3D(true)}
                                >
                                    Inspect Dial in 3D ↺
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Chapter 2: The Monobloc Case */}
                    <section className="story-chapter story-chapter--left">
                        <div className="chapter-card" data-reveal>
                            <span className="chapter-number">Chapter 02</span>
                            <p className="lx-kicker">SCULPTED IN GOLD</p>
                            <h2>Monobloc Case &amp; Fluted Bezel.</h2>
                            <p>
                                Turned from a single billet of gold on high-precision lathes, then hand-mirror
                                chamfered along the curved flanks. Protected by scratch-resistant sapphire crystal
                                with anti-reflective treatment on both faces.
                            </p>

                            <div className="chapter-specs-row">
                                <div className="chapter-spec-item">
                                    <span>Case Architecture</span>
                                    <strong>40mm Monobloc Lathe</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Crystal</span>
                                    <strong>Scratch-Proof Sapphire</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Crown</span>
                                    <strong>Twinlock Screw-Down</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Water Resistance</span>
                                    <strong>100m / 330ft Certified</strong>
                                </div>
                            </div>

                            <div className="chapter-actions">
                                <a href="#collection" className="btn-ghost">
                                    Browse 40mm Watches
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Chapter 3: The Bracelet */}
                    <section className="story-chapter story-chapter--right">
                        <div className="chapter-card" data-reveal>
                            <span className="chapter-number">Chapter 03</span>
                            <p className="lx-kicker">ERGONOMIC ARTICULATION</p>
                            <h2>Integrated Three-Link Oyster.</h2>
                            <p>
                                Each solid link is curved to drape naturally over the wrist. Alternating satin-brushed
                                outer shoulders and mirror-polished centre links culminate in a concealed deployment
                                clasp adorned with the Aureo emblem.
                            </p>

                            <div className="chapter-specs-row">
                                <div className="chapter-spec-item">
                                    <span>Link Geometry</span>
                                    <strong>Three-Piece Solid Gold</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Finish</span>
                                    <strong>Satin Flanks &amp; Mirror Core</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Clasp</span>
                                    <strong>Concealed Folding Crownclasp</strong>
                                </div>
                                <div className="chapter-spec-item">
                                    <span>Movement</span>
                                    <strong>Calibre A-2026 Automatic</strong>
                                </div>
                            </div>

                            <div className="chapter-actions">
                                <a href="#collection" className="btn-gold">
                                    Acquire This Piece
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* The Curated Edit (Product Collection Grid)                         */}
            {/* ---------------------------------------------------------------- */}
            <section id="collection" className="collection-lux-section">
                <div className="lux-container">
                    <div className="lux-section-header" data-reveal>
                        <div>
                            <p className="lx-kicker">THE CURRENT EDIT</p>
                            <h2>Selected Timepieces</h2>
                        </div>
                        <Link to="/catalog" className="btn-ghost">
                            View Entire Vault <IconArrow />
                        </Link>
                    </div>

                    <div className="filter-pills-row" data-reveal>
                        <Link to="/catalog" className="filter-pill is-active">All Pieces</Link>
                        <Link to="/catalog?condition=new" className="filter-pill">Factory New</Link>
                        <Link to="/catalog?condition=second-hand" className="filter-pill">Certified Pre-Owned</Link>
                        <Link to="/catalog?movement=automatic" className="filter-pill">Automatic</Link>
                        <span className="filter-count">
                            {productsLoading
                                ? "Auditing Vault..."
                                : `${pagination?.totalProducts ?? products.length} Available Pieces`}
                        </span>
                    </div>

                    <div className="lux-product-grid">
                        {productsLoading && visibleProducts.length === 0 && (
                            <p className="catalog-message">Unlocking the vault collection...</p>
                        )}

                        {productsError && (
                            <p className="catalog-message error">{productsError}</p>
                        )}

                        {!productsError &&
                            visibleProducts.map((product) => (
                                <article className="lux-watch-card" key={product._id} data-reveal>
                                    <div className="lux-card-image-wrap">
                                        <img
                                            src={
                                                product.images?.[0]?.url ||
                                                "https://images.unsplash.com/photo-1523170335258-f5ed11844a49"
                                            }
                                            alt={product.name}
                                            loading="lazy"
                                        />
                                        <span className={`lux-card-badge ${product.stock === 0 ? "lux-card-badge--sold" : ""}`}>
                                            {product.stock === 0
                                                ? "Archived / Sold"
                                                : product.condition === "second-hand"
                                                ? "1 of 1 · Pre-Owned"
                                                : "Factory New"}
                                        </span>
                                    </div>

                                    <div className="lux-card-body">
                                        <span className="lux-card-brand">{product.brand}</span>
                                        <h3 className="lux-card-title">{product.name}</h3>

                                        <div className="lux-card-footer">
                                            <span className="lux-card-price">{formatPrice(product.price)}</span>
                                            <Link to={`/product/${product._id}`} className="lux-card-link">
                                                Inspect <IconArrow />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    {hasMore && (
                        <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-hidden="true" />
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="lux-pagination" data-reveal>
                            <button
                                type="button"
                                className="lux-page-btn"
                                disabled={page <= 1}
                                onClick={() => setPage(1)}
                            >
                                ← First Page
                            </button>
                            <span className="lux-page-info">
                                Page {page} of {totalPages} · {visibleProducts.length} pieces on view
                            </span>
                            <button
                                type="button"
                                className="lux-page-btn"
                                disabled={!hasMore}
                                onClick={loadMore}
                            >
                                Load Next Timepieces →
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* Master Horology Atelier Section                                    */}
            {/* ---------------------------------------------------------------- */}
            <section id="story" className="atelier-section">
                <div className="lux-container">
                    <div className="atelier-grid">
                        <div className="atelier-visual" data-reveal>
                            <img src={atelierImg} alt="Master watchmaker inspecting movement" />
                            <div className="atelier-visual-badge">
                                <strong>Aureo Atelier</strong>
                                <span>Master horologists hand-regulating every chronometer to within ±2 seconds daily.</span>
                            </div>
                        </div>

                        <div className="atelier-content" data-reveal>
                            <p className="lx-kicker">HOROLOGICAL CRAFTSMANSHIP</p>
                            <h2>Where Silence Meets Micron Precision.</h2>
                            <p>
                                Before any timepiece enters our vault or departs for its new custodian, it undergoes
                                an exhaustive 48-hour mechanical audit. From amplitude testing on Swiss timing
                                machines to laser micro-welding and ultrasonic bath restoration, nothing is left to chance.
                            </p>

                            <div className="atelier-pillars">
                                <div className="atelier-pillar">
                                    <strong><IconWatch /> Escapement Timing</strong>
                                    <p>Regulated across 5 positions to ensure chronometric accuracy under all conditions.</p>
                                </div>
                                <div className="atelier-pillar">
                                    <strong><IconTool /> Ultrasonic Restorations</strong>
                                    <p>Individual component cleansing preserving the untouched patina of vintage brass.</p>
                                </div>
                                <div className="atelier-pillar">
                                    <strong><IconShield /> Certified Authenticity</strong>
                                    <p>Complete serial matching against brand archives and international registries.</p>
                                </div>
                                <div className="atelier-pillar">
                                    <strong><IconSparkle /> Lifetime Aftercare</strong>
                                    <p>Comprehensive service warranty and complimentary seasonal water resistance tests.</p>
                                </div>
                            </div>

                            <Link to="/services" className="btn-gold">
                                Explore Atelier Services <IconArrow />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* Maison Services Strip                                              */}
            {/* ---------------------------------------------------------------- */}
            <section id="services" className="services-strip-lux">
                <div className="lux-container">
                    <div className="lux-section-header" data-reveal>
                        <div>
                            <p className="lx-kicker">BEYOND ACQUISITION</p>
                            <h2>Comprehensive Watch Services</h2>
                        </div>
                        <Link to="/services" className="btn-ghost">
                            View All Services <IconArrow />
                        </Link>
                    </div>

                    <div className="services-cards-grid">
                        <article className="service-card-lux" data-reveal>
                            <div className="service-icon"><IconScale /></div>
                            <h3>Private Valuation &amp; Appraisal</h3>
                            <p>
                                Receive an exhaustive valuation dossier authored by certified horological appraisers,
                                backed by real-time secondary market transaction indices.
                            </p>
                            <Link to="/sell">
                                Request Appraisal <IconArrow />
                            </Link>
                        </article>

                        <article className="service-card-lux" data-reveal>
                            <div className="service-icon"><IconTool /></div>
                            <h3>Movement Overhaul &amp; Polish</h3>
                            <p>
                                Complete disassembly, chemical sonic cleansing, synthetic lubrication, and optional
                                satin/mirror case re-finishing honoring factory geometry.
                            </p>
                            <Link to="/services">
                                Book Servicing <IconArrow />
                            </Link>
                        </article>

                        <article className="service-card-lux" data-reveal>
                            <div className="service-icon"><IconShield /></div>
                            <h3>Private Consignment &amp; Buyout</h3>
                            <p>
                                Sell your luxury timepiece directly to our private collector network with guaranteed
                                escrow settlement and fully insured express collection.
                            </p>
                            <Link to="/sell">
                                Sell Your Timepiece <IconArrow />
                            </Link>
                        </article>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </main>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
                <Routes>
                    <Route path="/" element={<StoreLanding />} />                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/me"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <ProfilePage />
                        </PrivateRoute>
                    }
                />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route
                    path="/wishlist"
                    element={
                        <PrivateRoute>
                            <WishlistPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/products"
                    element={
                        <AdminRoute>
                            <AdminProductsPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/orders"
                    element={
                        <AdminRoute>
                            <AdminOrdersPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/appraisals"
                    element={
                        <AdminRoute>
                            <AdminAppraisalsPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/sell"
                    element={
                        <PrivateRoute>
                            <SellWatchPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/appraisals"
                    element={
                        <PrivateRoute>
                            <MyAppraisalsPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/services"
                    element={
                        <PrivateRoute>
                            <ServicesPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/services"
                    element={
                        <AdminRoute>
                            <AdminServicesPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/tickets"
                    element={
                        <AdminRoute>
                            <AdminTicketsPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/dashboard"
                    element={
                        <AdminRoute>
                            <AdminDashboardPage />
                        </AdminRoute>
                    }
                />
                <Route path="/cart" element={<CartPage />} />
                <Route
                    path="/checkout"
                    element={
                        <PrivateRoute>
                            <CheckoutPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/orders"
                    element={
                        <PrivateRoute>
                            <OrdersPage />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/order/:id"
                    element={
                        <PrivateRoute>
                            <OrderDetailPage />
                        </PrivateRoute>
                    }
                />
                </Routes>
            </Suspense>

            <ChatWidget />
        </BrowserRouter>
    );
}

export default App;