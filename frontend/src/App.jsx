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

    // Quiz 3: the homepage product list is paginated and also supports
    // infinite scroll. `visibleProducts` holds every page that was loaded so
    // the grid keeps the pieces that are already on screen.
    const [visibleProducts, setVisibleProducts] = useState([]);
    const [loadedPage, setLoadedPage] = useState(0);

    useEffect(() => {
        dispatch(getProducts({ page, limit: 8 }));
    }, [dispatch, page]);

    // The pages that were already loaded are kept while the next page is
    // fetched, so the grid never empties. The accumulation happens while
    // rendering to avoid an extra render pass.
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

    const { isAuthenticated, user } = useSelector((state) => state.auth);

    // The cart lives in localStorage, so the badge is derived from it. The
    // initial value is computed lazily and refreshed through the custom
    // "aureo:cart-updated" event that the cart pages dispatch.
    const readCartCount = () => {
        try {
            const raw = localStorage.getItem("aureoCart");
            const items = raw ? JSON.parse(raw) : [];
            return items.reduce((acc, item) => acc + (item.quantity || 1), 0);
        } catch {
            return 0;
        }
    };

    const [cartCount, setCartCount] = useState(readCartCount);

    useEffect(() => {
        const handleCartUpdate = () => setCartCount(readCartCount());

        window.addEventListener("storage", handleCartUpdate);
        window.addEventListener("aureo:cart-updated", handleCartUpdate);

        return () => {
            window.removeEventListener("storage", handleCartUpdate);
            window.removeEventListener("aureo:cart-updated", handleCartUpdate);
        };
    }, []);

    return (
        <main className="storefront">
            <header className="navbar">
                <a className="logo" href="#top">AUREO</a>

                <nav className="nav-links">
                    <Link to="/catalog">Collection</Link>
                    <Link to="/sell">Sell your watch</Link>
                    <Link to="/appraisals">Appraisals</Link>
                    <Link to="/wishlist">Wishlist</Link>
                    {isAuthenticated && <Link to="/orders">Orders</Link>}
                    {user?.role === "admin" && (
                        <>
                            <Link to="/admin/products" style={{ color: "var(--gold)", fontWeight: 600 }}>
                                Vault (Admin)
                            </Link>
                            <Link to="/admin/orders" style={{ color: "var(--gold)", fontWeight: 600 }}>
                                Orders (Admin)
                            </Link>
                            <Link to="/admin/appraisals" style={{ color: "var(--gold)", fontWeight: 600 }}>
                                Appraisals (Admin)
                            </Link>
                        </>
                    )}
                </nav>

                <div className="nav-actions">
                    <Link to="/catalog" className="nav-action">
                        Browse Catalog
                    </Link>
                    {isAuthenticated ? (
                        <Link className="nav-action" to="/me" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--gold)", fontWeight: 600 }}>
                            {user?.avatar?.url && (
                                <img
                                    src={user.avatar.url}
                                    alt="Avatar"
                                    style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--gold)" }}
                                />
                            )}
                            <span>{user?.name ? user.name.split(" ")[0] : "Account"}</span>
                        </Link>
                    ) : (
                        <Link className="nav-action" to="/login">
                            Account
                        </Link>
                    )}
                    <Link to="/cart" className="cart-button">
                        Bag <span>{cartCount}</span>
                    </Link>
                </div>
            </header>

            <section id="top" className="hero-section">
                <div className="hero-copy">
                    <p className="eyebrow">CURATED WATCHES / EST. 2026</p>
                    <h1>Wear something worth remembering.</h1>
                    <p className="hero-description">
                        A considered collection of mechanical watches, rare finds,
                        and trusted aftercare for the pieces that mark your time.
                    </p>

                    <div className="hero-actions">
                        <a className="gold-button" href="#collection">
                            Explore collection
                        </a>
                        <button
                            type="button"
                            className="outline-button"
                            onClick={() => navigate("/sell")}
                        >
                            Sell your watch
                        </button>
                    </div>

                    <div className="hero-meta">
                        <span>Free local delivery</span>
                        <span>Verified pieces</span>
                        <span>Aftercare available</span>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="visual-label">FEATURED PIECE / 001</div>
                    <Suspense
                        fallback={
                            <div className="hero-3d hero-3d-skeleton" aria-hidden="true" />
                        }
                    >
                        <WatchHero />
                    </Suspense>
                    <div className="visual-caption">
                        <strong>Quiet precision.</strong>
                        <span>Automatic movement / 40mm case</span>
                    </div>
                </div>
            </section>

            <section id="collection" className="collection-section">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">THE CURRENT EDIT</p>
                        <h2>Selected watches</h2>
                    </div>

                    <Link
                        to="/catalog"
                        className="text-link"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                    >
                        View all watches
                    </Link>
                </div>

                <div className="filter-row">
                    <Link to="/catalog" className="filter-chip active">All pieces</Link>
                    <Link to="/catalog?condition=new" className="filter-chip">New</Link>
                    <Link to="/catalog?condition=second-hand" className="filter-chip">Pre-owned</Link>
                    <Link to="/catalog?movement=automatic" className="filter-chip">Automatic</Link>
                    <span className="result-count">
                        {productsLoading
                            ? "Loading..."
                            : `${pagination?.totalProducts ?? products.length} pieces`}
                    </span>
                </div>

                <div className="product-grid">
                    {productsLoading && visibleProducts.length === 0 && (
                        <p className="catalog-message">Loading the collection...</p>
                    )}

                    {productsError && (
                        <p className="catalog-message error">{productsError}</p>
                    )}

                    {!productsError &&
                        visibleProducts.map((product) => (
                            <article className="product-card" key={product._id}>
                                <div className="product-image">
                                    <img
                                        src={
                                            product.images?.[0]?.url ||
                                            "https://images.unsplash.com/photo-1523170335258-f5ed11844a49"
                                        }
                                        alt={product.name}
                                    />
                                    <span>
                                        {product.stock === 0
                                            ? "Sold"
                                            : product.condition}
                                    </span>
                                </div>

                                <div className="product-info">
                                    <p className="product-brand">{product.brand}</p>

                                    <h3>{product.name}</h3>

                                    <div className="product-bottom">
                                        <strong>{formatPrice(product.price)}</strong>

                                        <Link to={`/product/${product._id}`}>View piece</Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                </div>

                {/* Quiz 3: infinite scroll sentinel. It loads the next page
                    when it scrolls into view. */}
                {hasMore && (
                    <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-hidden="true" />
                )}

                {/* Quiz 3: homepage pagination */}
                {totalPages > 1 && (
                    <div className="pagination-bar">
                        <button
                            type="button"
                            className="pagination-btn"
                            disabled={page <= 1}
                            onClick={() => setPage(1)}
                        >
                            ← Previous
                        </button>
                        <span className="page-indicator">
                            Page {page} of {totalPages} &bull; {visibleProducts.length} loaded
                        </span>
                        <button
                            type="button"
                            className="pagination-btn"
                            disabled={!hasMore}
                            onClick={loadMore}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </section>

            <section id="services" className="service-strip">
                <div>
                    <p className="eyebrow">BEYOND THE SALE</p>
                    <h2>Keep your timepiece in its best condition.</h2>
                </div>

                <div className="service-items">
                    <span>01 / Cleaning</span>
                    <span>02 / Repair</span>
                    <span>03 / Appraisal</span>
                </div>
            </section>

            <section id="story" className="story-section">
                <p className="eyebrow">THE AUREO STANDARD</p>
                <p className="story-copy">
                    Every piece deserves a clear history, an honest description,
                    and the right care after it leaves our hands.
                </p>
            </section>

            <footer className="footer">
                <span className="logo">AUREO</span>
                <span>Watches with a point of view.</span>
                <span>Local showroom / Online collection</span>
            </footer>
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