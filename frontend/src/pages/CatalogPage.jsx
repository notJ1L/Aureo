import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProducts, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";

function CatalogPage() {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const { products, pagination, loading, error } = useSelector((state) => state.productList);
    const { wishlist } = useSelector((state) => state.wishlist);
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
    const [brand, setBrand] = useState(searchParams.get("brand") || "");
    const [movement, setMovement] = useState(searchParams.get("movement") || "");
    const [condition, setCondition] = useState(searchParams.get("condition") || "");
    const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
    const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
    const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

    const brandsList = ["Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Cartier", "Grand Seiko", "Tudor", "IWC"];

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getWishlist());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        const params = {};
        if (keyword) params.keyword = keyword;
        if (brand) params.brand = brand;
        if (movement) params.movement = movement;
        if (condition) params.condition = condition;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (page > 1) params.page = page;

        setSearchParams(params);
        dispatch(getProducts(params));
    }, [dispatch, keyword, brand, movement, condition, minPrice, maxPrice, page, setSearchParams]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price);
    };

    const isWishlisted = (productId) => {
        return wishlist?.some((item) => (item._id || item) === productId);
    };

    const handleWishlistToggle = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            alert("Please sign in to save watches to your wishlist.");
            return;
        }
        if (isWishlisted(productId)) {
            dispatch(removeFromWishlist(productId));
        } else {
            dispatch(addToWishlist(productId));
        }
    };

    const handleResetFilters = () => {
        setKeyword("");
        setBrand("");
        setMovement("");
        setCondition("");
        setMinPrice("");
        setMaxPrice("");
        setPage(1);
    };

    return (
        <main className="catalog-page">
            <header className="navbar">
                <Link className="logo" to="/">AUREO</Link>

                <nav className="nav-links">
                    <Link to="/catalog" style={{ color: "var(--gold)" }}>Collection</Link>
                    <Link to="/#services">Services</Link>
                    <Link to="/wishlist">Wishlist</Link>
                </nav>

                <div className="nav-actions">
                    {isAuthenticated ? (
                        <Link className="nav-action" to="/me" style={{ color: "var(--gold)", fontWeight: 600 }}>
                            {user?.name?.split(" ")[0] || "Account"}
                        </Link>
                    ) : (
                        <Link className="nav-action" to="/login">Sign in</Link>
                    )}
                </div>
            </header>

            <div className="catalog-container">
                {/* Filter Sidebar */}
                <aside className="catalog-sidebar">
                    <div className="sidebar-head">
                        <h3>Filters</h3>
                        <button type="button" onClick={handleResetFilters} className="clear-filters-btn">
                            Reset All
                        </button>
                    </div>

                    <div className="filter-group">
                        <label className="filter-title">Search Timepieces</label>
                        <input
                            type="text"
                            placeholder="Search model, brand..."
                            value={keyword}
                            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
                            className="catalog-input"
                        />
                    </div>

                    <div className="filter-group">
                        <label className="filter-title">Brand</label>
                        <select
                            value={brand}
                            onChange={(e) => { setBrand(e.target.value); setPage(1); }}
                            className="catalog-select"
                        >
                            <option value="">All Brands</option>
                            {brandsList.map((b) => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label className="filter-title">Movement</label>
                        <div className="radio-pill-group">
                            {["", "automatic", "manual", "quartz"].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    className={`pill-btn ${movement === m ? "active" : ""}`}
                                    onClick={() => { setMovement(m); setPage(1); }}
                                >
                                    {m === "" ? "Any" : m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <label className="filter-title">Condition</label>
                        <div className="radio-pill-group">
                            {["", "new", "second-hand"].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`pill-btn ${condition === c ? "active" : ""}`}
                                    onClick={() => { setCondition(c); setPage(1); }}
                                >
                                    {c === "" ? "Any" : c === "second-hand" ? "Second-hand" : "Brand New"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-group">
                        <label className="filter-title">Price Range (PHP)</label>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                                className="catalog-input"
                            />
                            <span>—</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                                className="catalog-input"
                            />
                        </div>
                    </div>
                </aside>

                {/* Main Product Grid Area */}
                <section className="catalog-main">
                    <div className="catalog-header-info">
                        <div>
                            <p className="eyebrow">TIMEPIECE CATALOG</p>
                            <h1>Curated Timepieces</h1>
                        </div>
                        <span className="result-count">
                            {loading ? "Searching..." : `${pagination?.totalProducts || products.length} Available`}
                        </span>
                    </div>

                    {error && (
                        <div className="empty-state">
                            <p>Unable to retrieve watch catalog.</p>
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && products.length === 0 && !error && (
                        <div className="empty-state">
                            <p>No watches matched your filter criteria.</p>
                            <span>Try adjusting price or condition filters.</span>
                            <button type="button" className="gold-button" onClick={handleResetFilters} style={{ marginTop: "1rem" }}>
                                View All Watches
                            </button>
                        </div>
                    )}

                    <div className="product-grid">
                        {products.map((watch) => {
                            const isSold = watch.stock === 0;
                            const isPreowned = watch.condition === "second-hand";
                            const inWishlist = isWishlisted(watch._id);

                            return (
                                <article className={`product-card ${isSold ? "sold-card" : ""}`} key={watch._id}>
                                    <div className="product-image-wrap">
                                        {watch.images?.[0]?.url ? (
                                            <img
                                                src={watch.images[0].url}
                                                alt={watch.name}
                                                className="product-image"
                                            />
                                        ) : (
                                            <div className="product-placeholder">
                                                <span>No photo</span>
                                            </div>
                                        )}

                                        <div className="badge-overlay">
                                            {isSold ? (
                                                <span className="badge sold-badge">SOLD</span>
                                            ) : isPreowned ? (
                                                <span className="badge preowned-badge">PRE-OWNED</span>
                                            ) : (
                                                <span className="badge new-badge">NEW</span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            className={`wishlist-heart-btn ${inWishlist ? "active" : ""}`}
                                            onClick={(e) => handleWishlistToggle(e, watch._id)}
                                            title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
                                        >
                                            ♥
                                        </button>
                                    </div>

                                    <Link to={`/product/${watch._id}`} className="product-info-link">
                                        <div className="product-info">
                                            <span className="product-brand">{watch.brand}</span>
                                            <h3 className="product-title">{watch.name}</h3>
                                            <p className="product-meta">
                                                {watch.movement} &bull; {watch.caseSize}mm &bull; {watch.condition}
                                            </p>
                                            <div className="card-footer-price">
                                                <span className="product-price">
                                                    {formatPrice(watch.price)}
                                                </span>
                                                <span className="view-detail-label">
                                                    Details →
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination?.totalPages > 1 && (
                        <div className="pagination-bar">
                            <button
                                type="button"
                                className="pagination-btn"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            >
                                ← Previous
                            </button>
                            <span className="page-indicator">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                type="button"
                                className="pagination-btn"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default CatalogPage;
