import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProducts, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import WatchCard from "../components/WatchCard";
import { IconSearch } from "../components/layout/icons";
import { WatchCardSkeleton } from "../components/ui/Skeleton";
import { AureoSelect } from "../components/ui";
import { showNotification } from "../utils/notification";
import "../styles/watchCard.css";
import "../styles/catalog.css";

const BRANDS = ["Rolex", "Patek Philippe", "Audemars Piguet", "Omega", "Cartier", "Grand Seiko", "Tudor", "IWC", "Seiko"];
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

const BRAND_OPTIONS = [{ value: "", label: "All brands" }, ...BRANDS.map((b) => ({ value: b, label: b }))];
const CATEGORY_OPTIONS = [{ value: "", label: "All categories" }, ...CATEGORIES];
const CASE_SIZE_OPTIONS = [
    { value: "", label: "Any size" },
    ...CASE_SIZES.map((size) => ({ value: String(size), label: `${size} mm` }))
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
    const [displayedProducts, setDisplayedProducts] = useState([]);

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
        const params = { limit: 8 };
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

    useEffect(() => {
        if (!products) return;
        if (page === 1) {
            setDisplayedProducts(products);
        } else {
            setDisplayedProducts((previous) => {
                const existingIds = new Set(previous.map((p) => p._id));
                const fresh = products.filter((p) => !existingIds.has(p._id));
                return fresh.length ? [...previous, ...fresh] : previous;
            });
        }
    }, [products, page]);

    const totalPages = pagination?.totalPages || 1;
    const hasMore = page < totalPages;

    const loadMore = () => {
        if (loading || !hasMore) {
            return;
        }
        setPage((current) => current + 1);
    };

    const sentinelRef = useInfiniteScroll({
        onLoadMore: loadMore,
        hasMore,
        loading,
        rootMargin: "300px"
    });

    const isWishlisted = (productId) =>
        wishlist?.some((item) => (item._id || item) === productId);

    const handleWishlistToggle = (e, watch) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            showNotification({
                type: "info",
                message: "Please sign in to save watches to your wishlist."
            });
            return;
        }
        if (isWishlisted(watch._id)) {
            dispatch(removeFromWishlist(watch._id));
            showNotification({
                type: "wishlist",
                message: `${watch.name} removed from your wishlist.`
            });
        } else {
            dispatch(addToWishlist(watch._id));
            showNotification({
                type: "wishlist",
                message: `${watch.name} saved to your wishlist.`
            });
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
                        <AureoSelect
                            id="cat-brand"
                            value={brand}
                            options={BRAND_OPTIONS}
                            onChange={(e) => change(setBrand)(e.target.value)}
                        />
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
                        <AureoSelect
                            id="cat-category"
                            value={category}
                            options={CATEGORY_OPTIONS}
                            onChange={(e) => change(setCategory)(e.target.value)}
                        />
                    </div>

                    <div className="cat-field">
                        <label htmlFor="cat-size">Case size</label>
                        <AureoSelect
                            id="cat-size"
                            value={caseSize}
                            options={CASE_SIZE_OPTIONS}
                            onChange={(e) => change(setCaseSize)(e.target.value)}
                        />
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

                    {!loading && !error && displayedProducts.length === 0 && (
                        <div className="cat-empty">
                            <p>No watches match your filters.</p>
                            <button type="button" className="btn-ghost" onClick={handleResetFilters}>
                                Clear filters
                            </button>
                        </div>
                    )}

                    {loading && displayedProducts.length === 0 ? (
                        <div className="watch-grid watch-grid--3" aria-busy="true">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <WatchCardSkeleton key={i} index={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="watch-grid watch-grid--3">
                            {displayedProducts.map((watch, i) => (
                                <WatchCard
                                    key={watch._id}
                                    watch={watch}
                                    index={i}
                                    wishlist={{
                                        active: isWishlisted(watch._id),
                                        onToggle: (e) => handleWishlistToggle(e, watch)
                                    }}
                                />
                            ))}

                            {loading && displayedProducts.length > 0 &&
                                Array.from({ length: 3 }).map((_, i) => (
                                    <WatchCardSkeleton key={`loading-more-${i}`} index={i} />
                                ))
                            }
                        </div>
                    )}

                    {hasMore && (
                        <div ref={sentinelRef} className="infinite-scroll-sentinel" aria-hidden="true" style={{ width: "100%", height: "40px", margin: "1.5rem 0" }} />
                    )}

                    {!hasMore && displayedProducts.length > 0 && (
                        <div className="cat-all-loaded" style={{ textAlign: "center", padding: "3rem 0 1.5rem", color: "#8d877b", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                            ✦ All {total} Horological References Loaded ✦
                        </div>
                    )}
                </section>
            </div>

            <SiteFooter />
        </main>
    );
}

export default CatalogPage;
