import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getProducts, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
import { AureoChip, AureoRating } from "../components/ui";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import "../styles/aureo.css";

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
    const [category, setCategory] = useState(searchParams.get("category") || "");
    const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
    const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
    const [caseSize, setCaseSize] = useState(searchParams.get("caseSize") || "");
    const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
    const [minReviews, setMinReviews] = useState(searchParams.get("minReviews") || "");
    const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

    const brandsList = ["Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Cartier", "Grand Seiko", "Tudor", "IWC"];
    const caseSizesList = [36, 38, 39, 40, 41, 42, 44];

    // MP2: the category filter uses the same values the product form stores.
    const categoriesList = [
        { value: "dress", label: "Dress" },
        { value: "diver", label: "Diver" },
        { value: "chronograph", label: "Chronograph" },
        { value: "sports", label: "Sports" },
        { value: "luxury", label: "Luxury" }
    ];

    const ratingOptions = [
        { value: "", label: "Any" },
        { value: "4", label: "4.0 & up" },
        { value: "3", label: "3.0 & up" },
        { value: "2", label: "2.0 & up" }
    ];

    const reviewOptions = [
        { value: "", label: "Any" },
        { value: "1", label: "1+ review" },
        { value: "5", label: "5+ reviews" },
        { value: "10", label: "10+ reviews" }
    ];

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getWishlist());
        }
    }, [dispatch, isAuthenticated]);

    // Keep the filter controls in step with the URL. The homepage links into
    // the catalog with a query string, so the filters have to follow it even
    // when the catalog page is already mounted. The state is adjusted while
    // rendering, which is the React pattern for reacting to a changed input.
    const paramsString = searchParams.toString();
    const [syncedParams, setSyncedParams] = useState(paramsString);

    if (paramsString !== syncedParams) {
        setSyncedParams(paramsString);
        setKeyword(searchParams.get("keyword") || "");
        setBrand(searchParams.get("brand") || "");
        setMovement(searchParams.get("movement") || "");
        setCondition(searchParams.get("condition") || "");
        setCategory(searchParams.get("category") || "");
        setMinPrice(searchParams.get("minPrice") || "");
        setMaxPrice(searchParams.get("maxPrice") || "");
        setCaseSize(searchParams.get("caseSize") || "");
        setMinRating(searchParams.get("minRating") || "");
        setMinReviews(searchParams.get("minReviews") || "");
        setPage(Number(searchParams.get("page")) || 1);
    }

    useEffect(() => {
        const params = {};
        if (keyword) params.keyword = keyword;
        if (brand) params.brand = brand;
        if (movement) params.movement = movement;
        if (condition) params.condition = condition;
        if (category) params.category = category;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (caseSize) params.caseSize = caseSize;
        if (minRating) params.minRating = minRating;
        if (minReviews) params.minReviews = minReviews;
        if (page > 1) params.page = page;

        setSearchParams(params);
        dispatch(getProducts(params));
    }, [
        dispatch,
        keyword,
        brand,
        movement,
        condition,
        category,
        minPrice,
        maxPrice,
        caseSize,
        minRating,
        minReviews,
        page,
        setSearchParams
    ]);

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
            toast.info("Please sign in to save watches to your wishlist.");
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
        setCategory("");
        setMinPrice("");
        setMaxPrice("");
        setCaseSize("");
        setMinRating("");
        setMinReviews("");
        setPage(1);
    };

    return (
        <main className="catalog-page">
            <SiteHeader variant="solid" />

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
                        <label className="filter-title">Case Size (mm)</label>
                        <select
                            value={caseSize}
                            onChange={(e) => { setCaseSize(e.target.value); setPage(1); }}
                            className="catalog-select"
                        >
                            <option value="">Any size</option>
                            {caseSizesList.map((size) => (
                                <option key={size} value={size}>{size}mm</option>
                            ))}
                        </select>
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

                    {/* MP2: category filter */}
                    <div className="filter-group">
                        <label className="filter-title">Category</label>
                        <select
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                            className="catalog-select"
                        >
                            <option value="">All Categories</option>
                            {categoriesList.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* MP2: ratings filter */}
                    <div className="filter-group">
                        <label className="filter-title">Minimum Rating</label>
                        <div className="radio-pill-group">
                            {ratingOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`pill-btn ${minRating === option.value ? "active" : ""}`}
                                    onClick={() => { setMinRating(option.value); setPage(1); }}
                                >
                                    {option.value ? (
                                        <>
                                            <AureoRating value={Number(option.value)} readOnly size="small" />
                                            <span className="pill-rating-label">{option.label}</span>
                                        </>
                                    ) : (
                                        option.label
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* MP2: review count filter */}
                    <div className="filter-group">
                        <label className="filter-title">Review Count</label>
                        <div className="radio-pill-group">
                            {reviewOptions.map((option) => (
                                <AureoChip
                                    key={option.value}
                                    label={option.label}
                                    color={minReviews === option.value ? "default" : "muted"}
                                    onClick={() => { setMinReviews(option.value); setPage(1); }}
                                    sx={{
                                        cursor: "pointer",
                                        border: minReviews === option.value
                                            ? "1px solid var(--gold)"
                                            : "1px solid var(--border)"
                                    }}
                                />
                            ))}
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
                                            {watch.numOfReviews > 0 ? (
                                                <div className="product-rating-row">
                                                    <AureoRating value={watch.ratings || 0} readOnly size="small" />
                                                    <span className="product-rating-count">
                                                        {(watch.ratings || 0).toFixed(1)} ({watch.numOfReviews})
                                                    </span>
                                                </div>
                                            ) : null}
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
            <SiteFooter />
        </main>
    );
}

export default CatalogPage;
