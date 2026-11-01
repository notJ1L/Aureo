import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getProducts, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import WatchCard from "../components/WatchCard";
import { IconSearch } from "../components/layout/icons";
import { WatchCardSkeleton } from "../components/ui/Skeleton";
import "../styles/watchCard.css";
import "../styles/catalog.css";

const BRANDS = ["Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Cartier", "Grand Seiko", "Tudor", "IWC"];
const CASE_SIZES = [36, 38, 39, 40, 41, 42, 44];

const MOVEMENTS = [
    { value: "", label: "All" },
    { value: "automatic", label: "Automatic" },
    { value: "manual", label: "Manual" },
    { value: "quartz", label: "Quartz" }
];

const CONDITIONS = [
    { value: "", label: "All" },
    { value: "new", label: "New" },
    { value: "second-hand", label: "Pre-owned" }
];

const CATEGORIES = [
    { value: "dress", label: "Dress" },
    { value: "diver", label: "Diver" },
    { value: "chronograph", label: "Chronograph" },
    { value: "sports", label: "Sports" },
    { value: "luxury", label: "Luxury" }
];

const RATINGS = [
    { value: "", label: "Any" },
    { value: "4", label: "4+" },
    { value: "3", label: "3+" },
    { value: "2", label: "2+" }
];

const REVIEWS = [
    { value: "", label: "Any" },
    { value: "1", label: "1+" },
    { value: "5", label: "5+" },
    { value: "10", label: "10+" }
];

function Chips({ options, value, onChange }) {
    return (
        <div className="cat-chips">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`cat-chip ${value === option.value ? "is-active" : ""}`}
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

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

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getWishlist());
        }
    }, [dispatch, isAuthenticated]);

    // Keep the filter controls in step with the URL, so links from other pages
    // (home, footer) apply their filters even if the catalog is already mounted.
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

    const isWishlisted = (productId) =>
        wishlist?.some((item) => (item._id || item) === productId);

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

    // Every filter change goes back to the first page.
    const change = (setter) => (value) => {
        setter(value);
        setPage(1);
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

    const labelOf = (list, value) => list.find((item) => item.value === value)?.label || value;

    const activeFilters = [];
    if (keyword) activeFilters.push({ label: `“${keyword}”`, clear: () => setKeyword("") });
    if (brand) activeFilters.push({ label: brand, clear: () => setBrand("") });
    if (movement) activeFilters.push({ label: labelOf(MOVEMENTS, movement), clear: () => setMovement("") });
    if (condition) activeFilters.push({ label: labelOf(CONDITIONS, condition), clear: () => setCondition("") });
    if (category) activeFilters.push({ label: labelOf(CATEGORIES, category), clear: () => setCategory("") });
    if (caseSize) activeFilters.push({ label: `${caseSize} mm`, clear: () => setCaseSize("") });
    if (minPrice || maxPrice) {
        activeFilters.push({
            label: `₱${minPrice || 0} – ${maxPrice ? `₱${maxPrice}` : "any"}`,
            clear: () => {
                setMinPrice("");
                setMaxPrice("");
            }
        });
    }
    if (minRating) activeFilters.push({ label: `${minRating}+ stars`, clear: () => setMinRating("") });
    if (minReviews) activeFilters.push({ label: `${minReviews}+ reviews`, clear: () => setMinReviews("") });

    const total = pagination?.totalProducts ?? products.length;

    return (
        <main className="cat-page">
            <SiteHeader variant="solid" />

            <div className="cat-layout">
                <aside className="cat-filters" aria-label="Filters">
                    <div className="cat-field">
                        <label htmlFor="cat-search">Search</label>
                        <div className="cat-search">
                            <IconSearch width={16} height={16} />
                            <input
                                id="cat-search"
                                type="text"
                                placeholder="Model or brand"
                                value={keyword}
                                onChange={(e) => change(setKeyword)(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="cat-field">
                        <label htmlFor="cat-brand">Brand</label>
                        <select id="cat-brand" value={brand} onChange={(e) => change(setBrand)(e.target.value)}>
                            <option value="">All brands</option>
                            {BRANDS.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="cat-field">
                        <span className="cat-label">Movement</span>
                        <Chips options={MOVEMENTS} value={movement} onChange={change(setMovement)} />
                    </div>

                    <div className="cat-field">
                        <span className="cat-label">Condition</span>
                        <Chips options={CONDITIONS} value={condition} onChange={change(setCondition)} />
                    </div>

                    <div className="cat-field">
                        <label htmlFor="cat-category">Category</label>
                        <select
                            id="cat-category"
                            value={category}
                            onChange={(e) => change(setCategory)(e.target.value)}
                        >
                            <option value="">All categories</option>
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="cat-field">
                        <label htmlFor="cat-size">Case size</label>
                        <select
                            id="cat-size"
                            value={caseSize}
                            onChange={(e) => change(setCaseSize)(e.target.value)}
                        >
                            <option value="">Any size</option>
                            {CASE_SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size} mm
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="cat-field">
                        <span className="cat-label">Price (PHP)</span>
                        <div className="cat-range">
                            <input
                                type="number"
                                min="0"
                                placeholder="Min"
                                aria-label="Minimum price"
                                value={minPrice}
                                onChange={(e) => change(setMinPrice)(e.target.value)}
                            />
                            <span aria-hidden="true">–</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="Max"
                                aria-label="Maximum price"
                                value={maxPrice}
                                onChange={(e) => change(setMaxPrice)(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="cat-field">
                        <span className="cat-label">Rating</span>
                        <Chips options={RATINGS} value={minRating} onChange={change(setMinRating)} />
                    </div>

                    <div className="cat-field">
                        <span className="cat-label">Reviews</span>
                        <Chips options={REVIEWS} value={minReviews} onChange={change(setMinReviews)} />
                    </div>
                </aside>

                <section className="cat-main">
                    <header className="cat-head">
                        <h1>Collection</h1>
                        <span className="cat-count">{loading ? "Loading…" : `${total} watches`}</span>
                    </header>

                    {activeFilters.length > 0 && (
                        <div className="cat-active">
                            {activeFilters.map((f, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="cat-tag"
                                    onClick={f.clear}
                                    aria-label={`Remove filter ${f.label}`}
                                >
                                    {f.label}
                                    <span aria-hidden="true">×</span>
                                </button>
                            ))}
                            <button type="button" className="cat-clear" onClick={handleResetFilters}>
                                Clear all
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="cat-empty">
                            <p>We couldn’t load the collection.</p>
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && !error && products.length === 0 && (
                        <div className="cat-empty">
                            <p>No watches match your filters.</p>
                            <button type="button" className="btn-ghost" onClick={handleResetFilters}>
                                Clear filters
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="watch-grid watch-grid--3" aria-busy="true">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <WatchCardSkeleton key={i} index={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="watch-grid watch-grid--3">
                            {products.map((watch, i) => (
                                <WatchCard
                                    key={watch._id}
                                    watch={watch}
                                    index={i}
                                    wishlist={{
                                        active: isWishlisted(watch._id),
                                        onToggle: (e) => handleWishlistToggle(e, watch._id)
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {pagination?.totalPages > 1 && (
                        <nav className="cat-pager" aria-label="Pagination">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            >
                                Previous
                            </button>
                            <span>
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={page >= pagination.totalPages}
                                onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                            >
                                Next
                            </button>
                        </nav>
                    )}
                </section>
            </div>

            <SiteFooter />
        </main>
    );
}

export default CatalogPage;
