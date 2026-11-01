import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
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
import { PrivateRoute, VerifiedRoute, AdminRoute } from "./routes/ProtectedRoutes";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import LuxuryHero from "./components/layout/LuxuryHero";
import { WatchCardSkeleton } from "./components/ui/Skeleton";
import "./App.css";

// The admin pages carry the heavy dependencies (Recharts and the data
// tables), so they are split out of the main bundle.
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminAppraisalsPage = lazy(() => import("./pages/admin/AdminAppraisalsPage"));
const AdminServicesPage = lazy(() => import("./pages/admin/AdminServicesPage"));
const AdminTicketsPage = lazy(() => import("./pages/admin/AdminTicketsPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));

function RouteFallback() {
    return <div className="route-fallback">Loading the vault...</div>;
}

import { useNavigate } from "react-router-dom";
import SiteHeader from "./components/layout/SiteHeader";
import SiteFooter from "./components/layout/SiteFooter";
import WatchCard from "./components/WatchCard";
import {
    IconArrow,
    IconShield,
    IconTruck,
    IconWatch,
    IconStar,
    IconSparkle,
    IconTool,
    IconScale
} from "./components/layout/icons";
import heroGold from "./assets/hero-gold.jpg";
import heroDiver from "./assets/hero-diver.jpg";
import heroSkeleton from "./assets/hero-skeleton.jpg";
import atelierImg from "./assets/atelier.jpg";
import "./styles/watchCard.css";
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
    const [activeTab, setActiveTab] = useState("all");

    // Interactive selector state (CADRAN inspired)
    const [selectorOccasion, setSelectorOccasion] = useState("diver");
    const [selectorSize, setSelectorSize] = useState("41");
    const [selectorMovement, setSelectorMovement] = useState("automatic");

    useEffect(() => {
        dispatch(getProducts({ page, limit: 8 }));
    }, [dispatch, page]);

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

    // Filter by active collection tab
    const filteredProducts = visibleProducts.filter((product) => {
        if (activeTab === "all") return true;
        if (activeTab === "preowned") return product.condition === "second-hand";
        if (activeTab === "chronograph") {
            const str = `${product.category} ${product.name}`.toLowerCase();
            return str.includes("chronograph") || str.includes("daytona") || str.includes("speedmaster");
        }
        if (activeTab === "diver") {
            const str = `${product.category} ${product.name}`.toLowerCase();
            return str.includes("diver") || str.includes("submariner") || str.includes("seamaster");
        }
        if (activeTab === "dress") {
            const str = `${product.category} ${product.name}`.toLowerCase();
            return str.includes("dress") || str.includes("calatrava") || str.includes("datejust") || str.includes("tank");
        }
        return true;
    });

    const handleSelectorSubmit = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (selectorOccasion) params.set("category", selectorOccasion);
        if (selectorSize) params.set("caseSize", selectorSize);
        if (selectorMovement) params.set("movement", selectorMovement);
        navigate(`/catalog?${params.toString()}`);
    };

    return (
        <main className="storefront-luxury">
            {/* Top Maison Trust Guarantee Banner */}
            <div className="home-top-marquee" aria-label="Maison Guarantees">
                <div className="home-top-marquee__inner">
                    <span><IconTruck width={13} height={13} /> Complimentary Armored Courier Worldwide</span>
                    <span className="marquee-sep">•</span>
                    <span><IconShield width={13} height={13} /> 100% Movement & Escapement Verified</span>
                    <span className="marquee-sep">•</span>
                    <span><IconWatch width={13} height={13} /> 2-Year In-House Chronometer Guarantee</span>
                    <span className="marquee-sep">•</span>
                    <span><IconSparkle width={13} height={13} /> Escrow-Secured Settlement</span>
                </div>
            </div>

            <SiteHeader variant="overlay" />

            {/* Editorial Hero Slider */}
            <LuxuryHero />

            {/* CADRAN-inspired Heritage Proof Metrics Bar */}
            <section className="home-metrics" aria-label="Horology Metrics & Provenance">
                <div className="home-container home-metrics__grid">
                    <div className="home-metric-card">
                        <span className="home-metric-card__num">2,400+</span>
                        <h4 className="home-metric-card__label">Timepieces Delivered</h4>
                        <p className="home-metric-card__sub">Insured door-to-door transit across 42 nations.</p>
                    </div>
                    <div className="home-metric-card">
                        <span className="home-metric-card__num">100%</span>
                        <h4 className="home-metric-card__label">Escapement Provenance</h4>
                        <p className="home-metric-card__sub">Every balance spring and calibre physically audited.</p>
                    </div>
                    <div className="home-metric-card">
                        <span className="home-metric-card__num">±2s</span>
                        <h4 className="home-metric-card__label">Daily Chronometer Variance</h4>
                        <p className="home-metric-card__sub">Tested across 5 positions & 3 temperatures.</p>
                    </div>
                    <div className="home-metric-card">
                        <span className="home-metric-card__num">4.9 / 5</span>
                        <h4 className="home-metric-card__label">Collector Trust Score</h4>
                        <p className="home-metric-card__sub">Based on verified private client acquisitions.</p>
                    </div>
                </div>
            </section>

            {/* LUXWATCH & UHREN inspired Department Spotlights */}
            <section className="home-departments" aria-label="Curated Departments">
                <div className="home-container">
                    <div className="home-section-header">
                        <span className="home-kicker">Curated Departments</span>
                        <h2 className="home-title">Four Pillars of Haute Horlogerie</h2>
                        <p className="home-lead">
                            Explore timepieces categorized by mechanical architecture, oceanic utility, and heritage craft.
                        </p>
                    </div>

                    <div className="home-dept-grid">
                        <Link to="/catalog?category=luxury" className="home-dept-card">
                            <img src={heroSkeleton} alt="Grand Complications" className="home-dept-card__img" />
                            <div className="home-dept-card__overlay">
                                <span className="home-dept-card__tag">Pillar I</span>
                                <h3 className="home-dept-card__title">Grand Complications</h3>
                                <p className="home-dept-card__desc">Perpetual calendars, tourbillons & split-second chronographs.</p>
                                <span className="home-dept-card__action">Explore Complications <IconArrow /></span>
                            </div>
                        </Link>

                        <Link to="/catalog?category=diver" className="home-dept-card">
                            <img src={heroDiver} alt="Deep-Sea Chronographs" className="home-dept-card__img" />
                            <div className="home-dept-card__overlay">
                                <span className="home-dept-card__tag">Pillar II</span>
                                <h3 className="home-dept-card__title">Deep-Sea Chronographs</h3>
                                <p className="home-dept-card__desc">Helium-release divers rated to extreme oceanic pressures.</p>
                                <span className="home-dept-card__action">Explore Divers <IconArrow /></span>
                            </div>
                        </Link>

                        <Link to="/catalog?category=dress" className="home-dept-card">
                            <img src={heroGold} alt="Heritage Dress & Slim" className="home-dept-card__img" />
                            <div className="home-dept-card__overlay">
                                <span className="home-dept-card__tag">Pillar III</span>
                                <h3 className="home-dept-card__title">Heritage Dress & Slim</h3>
                                <p className="home-dept-card__desc">18K rose & white gold hand-wound classics for formal occasions.</p>
                                <span className="home-dept-card__action">Explore Dress <IconArrow /></span>
                            </div>
                        </Link>

                        <Link to="/catalog?condition=second-hand" className="home-dept-card">
                            <img src={atelierImg} alt="Certified Pre-Owned Vault" className="home-dept-card__img" />
                            <div className="home-dept-card__overlay">
                                <span className="home-dept-card__tag">Pillar IV</span>
                                <h3 className="home-dept-card__title">Vault 1-of-1 Pre-Owned</h3>
                                <p className="home-dept-card__desc">Discontinued grails with restored amplitude and archive extracts.</p>
                                <span className="home-dept-card__action">Explore Pre-Owned <IconArrow /></span>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Curated Vault Collection Grid with Interactive Tabs */}
            <section id="collection" className="home-section home-collection">
                <div className="home-container">
                    <div className="home-collection__header">
                        <div>
                            <span className="home-kicker">Archival Curation</span>
                            <h2 className="home-title">The Curated Vault Collection</h2>
                            <p className="home-lead">
                                Hand-inspected, chronometer-tested timepieces available for immediate armored dispatch.
                            </p>
                        </div>
                        <Link to="/catalog" className="btn-ghost">
                            Complete Catalog ({pagination?.totalCount || visibleProducts.length}) <IconArrow />
                        </Link>
                    </div>

                    {/* Interactive Filter Pills */}
                    <div className="home-tabs" role="tablist" aria-label="Collection categories">
                        {[
                            { id: "all", label: "All Curations" },
                            { id: "chronograph", label: "Chronographs" },
                            { id: "diver", label: "Divers & Abyss" },
                            { id: "dress", label: "Heritage Dress" },
                            { id: "preowned", label: "Vault Pre-Owned" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`home-tab ${activeTab === tab.id ? "is-active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {productsError && <p className="home-message">{productsError}</p>}

                    <div className="watch-grid watch-grid--4">
                        {productsLoading &&
                            visibleProducts.length === 0 &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <WatchCardSkeleton key={`sk-${i}`} index={i} />
                            ))}

                        {!productsError &&
                            filteredProducts.map((product, i) => (
                                <WatchCard key={product._id} watch={product} index={i} />
                            ))}

                        {productsLoading &&
                            visibleProducts.length > 0 &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <WatchCardSkeleton key={`more-${i}`} index={i} />
                            ))}
                    </div>

                    {hasMore && (
                        <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-hidden="true" />
                    )}

                    {hasMore && !productsLoading && (
                        <div className="home-more">
                            <button type="button" className="btn-gold" onClick={loadMore}>
                                Load Additional References <IconArrow />
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* CADRAN-inspired Interactive Collector Tool: "Find Your Reference" */}
            <section className="home-selector-section" aria-label="Reference Selector">
                <div className="home-container">
                    <div className="home-selector-box">
                        <div className="home-selector-intro">
                            <span className="home-kicker">Interactive Advisory</span>
                            <h3 className="home-selector-title">Not Sure Which Reference Fits Your Collection?</h3>
                            <p className="home-selector-text">
                                Define your desired horological parameters to immediately view matching verified timepieces.
                            </p>
                        </div>

                        <form className="home-selector-form" onSubmit={handleSelectorSubmit}>
                            <div className="home-selector-group">
                                <label className="home-selector-label">Occasion & Style</label>
                                <div className="home-selector-pills">
                                    {[
                                        { val: "sports", label: "Daily Sports" },
                                        { val: "diver", label: "Abyss Diver" },
                                        { val: "dress", label: "Formal Dress" },
                                        { val: "luxury", label: "Complication" }
                                    ].map((opt) => (
                                        <button
                                            key={opt.val}
                                            type="button"
                                            className={`selector-pill ${selectorOccasion === opt.val ? "is-active" : ""}`}
                                            onClick={() => setSelectorOccasion(opt.val)}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="home-selector-group">
                                <label className="home-selector-label">Case Diameter</label>
                                <div className="home-selector-pills">
                                    {["38", "40", "41", "42", "44"].map((sz) => (
                                        <button
                                            key={sz}
                                            type="button"
                                            className={`selector-pill ${selectorSize === sz ? "is-active" : ""}`}
                                            onClick={() => setSelectorSize(sz)}
                                        >
                                            {sz}mm
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="home-selector-group">
                                <label className="home-selector-label">Movement Calibre</label>
                                <div className="home-selector-pills">
                                    {[
                                        { val: "automatic", label: "Automatic" },
                                        { val: "manual", label: "Manual Wind" },
                                        { val: "quartz", label: "Quartz" }
                                    ].map((mv) => (
                                        <button
                                            key={mv.val}
                                            type="button"
                                            className={`selector-pill ${selectorMovement === mv.val ? "is-active" : ""}`}
                                            onClick={() => setSelectorMovement(mv.val)}
                                        >
                                            {mv.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn-gold home-selector-cta">
                                View Matching Timepieces <IconArrow />
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* Master Horology Atelier Feature (CADRAN & WATCHES inspired) */}
            <section className="home-atelier" aria-label="Inside the Atelier">
                <div className="home-container home-atelier__grid">
                    <div className="home-atelier__media">
                        <img src={atelierImg} alt="Master Watchmaker at work in the Aureo Atelier" />
                        <div className="home-atelier__seal">
                            <span className="seal-tag">● Geneva Horological Suite</span>
                            <h4 className="seal-title">Five-Position Chronometer Audit</h4>
                            <p className="seal-desc">Every escapement tested for amplitude, beat error, and delta rate before sealing.</p>
                        </div>
                    </div>

                    <div className="home-atelier__copy">
                        <span className="home-kicker">Atelier Craftsmanship</span>
                        <h2 className="home-title">Where Silence Meets Micron Precision</h2>
                        <p className="home-lead">
                            At Aureo, timepieces are not simply sold; they are preserved. Our horologists combine Swiss tradition with state-of-the-art diagnostic technology.
                        </p>

                        <div className="home-pillars">
                            <div className="home-pillar">
                                <div className="home-pillar__icon"><IconWatch /></div>
                                <div>
                                    <h4 className="home-pillar__title">48-Hour Isochronism Audit</h4>
                                    <p className="home-pillar__desc">
                                        Timed on Swiss Witschi chronometric acoustic sensors across heat, cold, and dial variances.
                                    </p>
                                </div>
                            </div>

                            <div className="home-pillar">
                                <div className="home-pillar__icon"><IconSparkle /></div>
                                <div>
                                    <h4 className="home-pillar__title">Ultrasonic Cleansing & Demagnetization</h4>
                                    <p className="home-pillar__desc">
                                        Free of magnetic interference and micro-debris to ensure factory balance amplitude.
                                    </p>
                                </div>
                            </div>

                            <div className="home-pillar">
                                <div className="home-pillar__icon"><IconShield /></div>
                                <div>
                                    <h4 className="home-pillar__title">Cryptographic & Physical Provenance</h4>
                                    <p className="home-pillar__desc">
                                        Archived reference dossier, high-resolution macro records, and tamper-evident sealing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="home-atelier__actions">
                            <Link to="/services" className="btn-gold">
                                Explore Atelier Services <IconArrow />
                            </Link>
                            <Link to="/sell" className="btn-ghost">
                                Consign or Sell Your Watch
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Collector Voices & Testimonials (CADRAN & LUXWATCH inspired) */}
            <section className="home-testimonials" aria-label="Collector Testimonials">
                <div className="home-container">
                    <div className="home-section-header">
                        <span className="home-kicker">Collector Voices</span>
                        <h2 className="home-title">Trusted by Horologists Worldwide</h2>
                        <p className="home-lead">
                            Hear from independent collectors who acquired their marquee references through Aureo.
                        </p>
                    </div>

                    <div className="home-testimonials__grid">
                        <div className="home-testimonial-card">
                            <div className="home-testimonial__stars">
                                {[...Array(5)].map((_, i) => (
                                    <IconStar key={i} width={14} height={14} />
                                ))}
                            </div>
                            <blockquote className="home-testimonial__quote">
                                "The provenance dossier and chronometer accuracy was beyond expectations. Receiving my Patek with the 5-position inspection certificate gave complete peace of mind."
                            </blockquote>
                            <div className="home-testimonial__author">
                                <strong>Marcus V.</strong>
                                <span>Zurich, Switzerland · Acquired Patek Philippe 5711</span>
                            </div>
                        </div>

                        <div className="home-testimonial-card">
                            <div className="home-testimonial__stars">
                                {[...Array(5)].map((_, i) => (
                                    <IconStar key={i} width={14} height={14} />
                                ))}
                            </div>
                            <blockquote className="home-testimonial__quote">
                                "The armored courier arrived within 48 hours. The condition of the Royal Oak was flawless, exact down to the factory beveling. Aureo is now my first stop."
                            </blockquote>
                            <div className="home-testimonial__author">
                                <strong>Kenji T.</strong>
                                <span>Tokyo, Japan · Acquired Audemars Piguet 15202</span>
                            </div>
                        </div>

                        <div className="home-testimonial-card">
                            <div className="home-testimonial__stars">
                                {[...Array(5)].map((_, i) => (
                                    <IconStar key={i} width={14} height={14} />
                                ))}
                            </div>
                            <blockquote className="home-testimonial__quote">
                                "Selling my Daytona through their private valuation was seamless. The escrow payout cleared the same day the watch reached their atelier. Unmatched professionalism."
                            </blockquote>
                            <div className="home-testimonial__author">
                                <strong>Eleanor R.</strong>
                                <span>London, UK · Consigned Rolex Daytona 116500LN</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Private Maison Services Strip */}
            <section className="home-services-strip" aria-label="Private Maison Services">
                <div className="home-container home-services__grid">
                    <Link to="/services" className="home-service-item">
                        <div className="home-service-item__icon"><IconTool /></div>
                        <div>
                            <h4 className="home-service-item__title">Restoration & Calibre Overhaul</h4>
                            <p className="home-service-item__desc">Swiss-trained horologists servicing complex complications.</p>
                        </div>
                    </Link>

                    <Link to="/sell" className="home-service-item">
                        <div className="home-service-item__icon"><IconScale /></div>
                        <div>
                            <h4 className="home-service-item__title">Private Appraisal & Valuation</h4>
                            <p className="home-service-item__desc">Certified market documentation for insurance and estates.</p>
                        </div>
                    </Link>

                    <Link to="/sell" className="home-service-item">
                        <div className="home-service-item__icon"><IconSparkle /></div>
                        <div>
                            <h4 className="home-service-item__title">Consignment & Direct Vault Buyout</h4>
                            <p className="home-service-item__desc">Instant escrow settlement at verified secondary market value.</p>
                        </div>
                    </Link>
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
                    <Route path="/" element={<StoreLanding />} />
                    <Route path="/login" element={<LoginPage />} />
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
                        <VerifiedRoute>
                            <SellWatchPage />
                        </VerifiedRoute>
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
                <Route path="/services" element={<ServicesPage />} />
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
                        <VerifiedRoute>
                            <CheckoutPage />
                        </VerifiedRoute>
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
