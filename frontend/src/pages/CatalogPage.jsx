import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getProducts, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { IconArrow, IconHeart, IconSearch, IconStar } from "../components/layout/icons";
import "../styles/catalogLuxury.css";

function CatalogPage() {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const { products, pagination, loading, error } = useSelector((state) => state.productList);
    const { wishlist } = useSelector((state) => state.wishlist);
    const { isAuthenticated } = useSelector((state) => state.auth);

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

    const brandsList = [
        "Rolex",
        "Patek Philippe",
        "Audemars Piguet",
        "Omega",
        "Cartier",
        "Grand Seiko",
        "Tudor",
        "IWC"
    ];
    const caseSizesList = [36, 38, 39, 40, 41, 42, 44];

    const categoriesList = [
        { value: "dress", label: "Dress" },
        { value: "diver", label: "Diver" },
        { value: "chronograph", label: "Chronograph" },
        { value: "sports", label: "Sports" },
        { value: "luxury", label: "Luxury" }
    ];

    const ratingOptions = [
        { value: "", label: "Any Rating" },
        { value: "4", label: "★ 4.0 & Up" },
        { value: "3", label: "★ 3.0 & Up" },
        { value: "2", label: "★ 2.0 & Up" }
    ];

    const reviewOptions = [
        { value: "", label: "Any" },
        { value: "1", label: "1+ Review" },
        { value: "5", label: "5+ Reviews" },
        { value: "10", label: "10+ Reviews" }
    ];

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getWishlist());
        }
    }, [dispatch, isAuthenticated]);

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
        }).format(price || 0);
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

    // Active filters summary
    const activeFilters = [];
    if (keyword) activeFilters.push({ label: `Search: "${keyword}"`, clear: () => setKeyword("") });
    if (brand) activeFilters.push({ label: `Maison: ${brand}`, clear: () => setBrand("") });
    if (movement) activeFilters.push({ label: `Calibre: ${movement}`, clear: () => setMovement("") });
    if (condition) activeFilters.push({ label: condition === "second-hand" ? "Pre-Owned" : "Factory New", clear: () => setCondition("") });
    if (category) activeFilters.push({ label: `Style: ${category}`, clear: () => setCategory("") });
    if (caseSize) activeFilters.push({ label: `${caseSize}mm`, clear: () => setCaseSize("") });
    if (minPrice || maxPrice) activeFilters.push({ label: `₱${minPrice || 0} – ₱${maxPrice || "Max"}`, clear: () => { setMinPrice(""); setMaxPrice(""); } });
    if (minRating) activeFilters.push({ label: `★ ${minRating}.0+`, clear: () => setMinRating("") });
    if (minReviews) activeFilters.push({ label: `${minReviews}+ Reviews`, clear: () => setMinReviews("") });

    return (
        <main className="catalog-luxury-page">
            <SiteHeader variant="solid" />

            <div className="catalog-lux-container">
                {/* ------------------------------------------------------------ */}
                {/* Refined Seamless Left Sidebar                                */}
                {/* ------------------------------------------------------------ */}
                <aside className="catalog-lux-sidebar" aria-label="Vault Filters">
                    <div className="sidebar-lux-head">
                        <div>
                            <p className="sidebar-lux-kicker">HOROLOGY ARCHIVE</p>
                            <h3>Refine Vault</h3>
                        </div>
                        {activeFilters.length > 0 && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="clear-lux-btn"
                                aria-label="Reset all filters"
                            >
                                Reset All
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div className="filter-lux-group">
                        <label className="filter-lux-label" htmlFor="search-timepieces">
                            <span>Search Vault</span>
                        </label>
                        <div className="search-lux-wrap">
                            <span className="search-lux-icon" aria-hidden="true">
                                <IconSearch width={16} height={16} />
                            </span>
                            <input
                                id="search-timepieces"
                                type="text"
                                placeholder="Model, ref., dial..."
                                value={keyword}
                                onChange={(e) => {
                                    setKeyword(e.target.value);
                                    setPage(1);
                                }}
                                className="search-lux-input"
                            />
                        </div>
                    </div>

                    {/* Maison / Brand */}
                    <div className="filter-lux-group">
                        <label className="filter-lux-label" htmlFor="select-brand">
                            <span>Maison / Brand</span>
                        </label>
                        <div className="select-lux-wrap">
                            <select
                                id="select-brand"
                                value={brand}
                                onChange={(e) => {
                                    setBrand(e.target.value);
                                    setPage(1);
                                }}
                                className="catalog-lux-select"
                            >
                                <option value="">All Prestigious Maisons</option>
                                {brandsList.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Movement Calibre */}
                    <div className="filter-lux-group">
                        <span className="filter-lux-label">Calibre Movement</span>
                        <div className="pills-lux-grid">
                            {[
                                { val: "", label: "All Movements" },
                                { val: "automatic", label: "Automatic" },
                                { val: "manual", label: "Manual Wind" },
                                { val: "quartz", label: "Quartz" }
                            ].map((m) => (
                                <button
                                    key={m.val}
                                    type="button"
                                    className={`pill-lux-btn ${movement === m.val ? "is-active" : ""}`}
                                    onClick={() => {
                                        setMovement(m.val);
                                        setPage(1);
                                    }}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Condition */}
                    <div className="filter-lux-group">
                        <span className="filter-lux-label">Condition State</span>
                        <div className="pills-lux-grid">
                            {[
                                { val: "", label: "All Pieces" },
                                { val: "new", label: "Factory New" },
                                { val: "second-hand", label: "Certified Pre-Owned" }
                            ].map((c) => (
                                <button
                                    key={c.val}
                                    type="button"
                                    className={`pill-lux-btn ${condition === c.val ? "is-active" : ""}`}
                                    onClick={() => {
                                        setCondition(c.val);
                                        setPage(1);
                                    }}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category */}
                    <div className="filter-lux-group">
                        <label className="filter-lux-label" htmlFor="select-category">
                            <span>Horological Style</span>
                        </label>
                        <div className="select-lux-wrap">
                            <select
                                id="select-category"
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setPage(1);
                                }}
                                className="catalog-lux-select"
                            >
                                <option value="">All Categories</option>
                                {categoriesList.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Case Diameter */}
                    <div className="filter-lux-group">
                        <label className="filter-lux-label" htmlFor="select-case-size">
                            <span>Case Diameter</span>
                        </label>
                        <div className="select-lux-wrap">
                            <select
                                id="select-case-size"
                                value={caseSize}
                                onChange={(e) => {
                                    setCaseSize(e.target.value);
                                    setPage(1);
                                }}
                                className="catalog-lux-select"
                            >
                                <option value="">Any Diameter</option>
                                {caseSizesList.map((size) => (
                                    <option key={size} value={size}>{size} mm</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="filter-lux-group">
                        <span className="filter-lux-label">Investment Range (PHP)</span>
                        <div className="price-lux-inputs">
                            <div className="price-field-wrap">
                                <span>₱</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => {
                                        setMinPrice(e.target.value);
                                        setPage(1);
                                    }}
                                    className="price-lux-input"
                                />
                            </div>
                            <span className="price-lux-sep">—</span>
                            <div className="price-field-wrap">
                                <span>₱</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => {
                                        setMaxPrice(e.target.value);
                                        setPage(1);
                                    }}
                                    className="price-lux-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Minimum Rating */}
                    <div className="filter-lux-group">
                        <span className="filter-lux-label">Collector Rating</span>
                        <div className="pills-lux-grid">
                            {ratingOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`pill-lux-btn ${minRating === option.value ? "is-active" : ""}`}
                                    onClick={() => {
                                        setMinRating(option.value);
                                        setPage(1);
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Review Volume */}
                    <div className="filter-lux-group">
                        <span className="filter-lux-label">Collector Reviews</span>
                        <div className="pills-lux-grid">
                            {reviewOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`pill-lux-btn ${minReviews === option.value ? "is-active" : ""}`}
                                    onClick={() => {
                                        setMinReviews(option.value);
                                        setPage(1);
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ------------------------------------------------------------ */}
                {/* Main Product Grid Area                                       */}
                {/* ------------------------------------------------------------ */}
                <section className="catalog-lux-main">
                    <div className="catalog-lux-header">
                        <div>
                            <div className="catalog-header-lead">
                                <span className="catalog-arrow-nav" aria-hidden="true">← →</span>
                                <p className="catalog-lux-kicker">OUR STORE · CERTIFIED VAULT</p>
                            </div>
                            <h1>Curated Timepieces</h1>
                        </div>
                        <span className="catalog-count-pill">
                            {loading
                                ? "Auditing Vault..."
                                : `${pagination?.totalProducts ?? products.length} Pieces Available`}
                        </span>
                    </div>

                    {/* Active Filter Chips */}
                    {activeFilters.length > 0 && (
                        <div className="active-filters-strip">
                            {activeFilters.map((f, i) => (
                                <span key={i} className="active-filter-chip">
                                    {f.label}
                                    <button
                                        type="button"
                                        onClick={f.clear}
                                        aria-label={`Remove filter ${f.label}`}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="clear-lux-btn"
                                style={{ marginLeft: "0.5rem" }}
                            >
                                Clear All
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="lux-empty-state">
                            <h3>Archival Retrieval Error</h3>
                            <p>{error}</p>
                            <button
                                type="button"
                                className="btn-gold"
                                onClick={() => dispatch(getProducts({}))}
                            >
                                Reload Vault
                            </button>
                        </div>
                    )}

                    {!loading && products.length === 0 && !error && (
                        <div className="lux-empty-state">
                            <h3>No Matching Timepieces</h3>
                            <p>No watches in our vault match the selected criteria.</p>
                            <button
                                type="button"
                                className="btn-gold"
                                onClick={handleResetFilters}
                            >
                                View Complete Collection <IconArrow />
                            </button>
                        </div>
                    )}

                    {/* Haute Horlogerie Gallery Cards */}
                    <div className="catalog-lux-grid">
                        {products.map((watch) => {
                            const isSold = watch.stock === 0;
                            const isPreowned = watch.condition === "second-hand";
                            const inWishlist = isWishlisted(watch._id);

                            return (
                                <article
                                    className={`lux-gallery-card ${isSold ? "is-sold" : ""}`}
                                    key={watch._id}
                                >
                                    <div className="lux-card-stage">
                                        {watch.images?.[0]?.url ? (
                                            <img
                                                src={watch.images[0].url}
                                                alt={watch.name}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="lux-stage-placeholder">
                                                <span>Archival Photo Pending</span>
                                            </div>
                                        )}

                                        <div className="lux-card-badge-wrap">
                                            <span
                                                className={`lux-badge-pill ${
                                                    isSold ? "lux-badge-pill--sold" : ""
                                                }`}
                                            >
                                                {isSold
                                                    ? "Archived / Sold"
                                                    : isPreowned
                                                    ? "1 of 1 · Certified Pre-Owned"
                                                    : "Factory New"}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            className={`lux-card-wish-btn ${
                                                inWishlist ? "is-active" : ""
                                            }`}
                                            onClick={(e) => handleWishlistToggle(e, watch._id)}
                                            aria-label={
                                                inWishlist
                                                    ? "Remove from wishlist"
                                                    : "Save to wishlist"
                                            }
                                        >
                                            <IconHeart
                                                width={16}
                                                height={16}
                                                fill={inWishlist ? "currentColor" : "none"}
                                            />
                                        </button>
                                    </div>

                                    <Link
                                        to={`/product/${watch._id}`}
                                        className="lux-card-content"
                                    >
                                        <span className="lux-card-brand-kicker">
                                            {watch.brand}
                                        </span>
                                        <h2 className="lux-card-title">{watch.name}</h2>
                                        <p className="lux-card-specs">
                                            {watch.movement?.toUpperCase() || "AUTOMATIC"} ·{" "}
                                            {watch.caseSize ? `${watch.caseSize}mm` : "40mm"} ·{" "}
                                            {isPreowned ? "Pre-Owned" : "Factory New"}
                                        </p>

                                        {watch.numOfReviews > 0 ? (
                                            <div className="lux-card-rating">
                                                <span className="star-icon" aria-hidden="true">
                                                    ★
                                                </span>
                                                <strong>
                                                    {(watch.ratings || 0).toFixed(1)}
                                                </strong>
                                                <span>({watch.numOfReviews} collector reviews)</span>
                                            </div>
                                        ) : (
                                            <div className="lux-card-rating">
                                                <span className="star-icon" aria-hidden="true">
                                                    ★
                                                </span>
                                                <span>Pristine Vault Specimen</span>
                                            </div>
                                        )}

                                        <div className="lux-card-bottom">
                                            <span className="lux-card-price">
                                                {formatPrice(watch.price)}
                                            </span>
                                            <span className="lux-inspect-link">
                                                Inspect <IconArrow width={14} height={14} />
                                            </span>
                                        </div>
                                    </Link>
                                </article>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination?.totalPages > 1 && (
                        <div className="lux-pagination-bar">
                            <button
                                type="button"
                                className="lux-page-nav-btn"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            >
                                ← Previous Pieces
                            </button>
                            <span className="lux-page-indicator">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                type="button"
                                className="lux-page-nav-btn"
                                disabled={page >= pagination.totalPages}
                                onClick={() =>
                                    setPage((p) => Math.min(p + 1, pagination.totalPages))
                                }
                            >
                                Next Pieces →
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
