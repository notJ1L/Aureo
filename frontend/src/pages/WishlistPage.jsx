import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getWishlist, removeFromWishlist } from "../redux/actions/productActions";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import "../styles/aureo.css";

function WishlistPage() {
    const dispatch = useDispatch();
    const { wishlist, loading, error } = useSelector((state) => state.wishlist);
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getWishlist());
        }
    }, [dispatch, isAuthenticated]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const handleRemove = (productId) => {
        dispatch(removeFromWishlist(productId));
    };

    return (
        <main className="wishlist-page page-enter">
            <SiteHeader variant="solid" />

            <div className="wishlist-container">
                <div className="wishlist-header">
                    <p className="eyebrow">SAVED SELECTION</p>
                    <h1>Your Curated Wishlist</h1>
                    <p className="auth-description">
                        Keep track of your favorite horological pieces, certified pre-owned watches, and historical editions.
                    </p>
                </div>

                {loading && (
                    <div className="wishlist-grid">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} style={{ height: "300px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", animation: "aureoPulseGold 2s infinite" }} />
                        ))}
                    </div>
                )}

                {error && <div className="auth-error">{error}</div>}

                {!loading && (!wishlist || wishlist.length === 0) && (
                    <div className="empty-state">
                        <p>Your wishlist is currently empty.</p>
                        <span>Explore our vault to find timepieces worth remembering.</span>
                        <Link to="/catalog" className="gold-button" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                            Explore Timepiece Catalog
                        </Link>
                    </div>
                )}

                <div className="wishlist-grid">
                    {wishlist?.map((watch) => {
                        const isSold = watch.stock === 0;

                        return (
                            <article className={`wishlist-card ${isSold ? "sold-card" : ""}`} key={watch._id}>
                                <div className="wishlist-img-wrap">
                                    {watch.images?.[0]?.url ? (
                                        <img src={watch.images[0].url} alt={watch.name} />
                                    ) : (
                                        <div className="product-placeholder">No photo</div>
                                    )}
                                    {isSold && <span className="badge sold-badge">SOLD OUT</span>}
                                </div>

                                <div className="wishlist-details">
                                    <span className="product-brand">{watch.brand}</span>
                                    <h3>{watch.name}</h3>
                                    <p className="product-price">{formatPrice(watch.price)}</p>

                                    <div className="wishlist-card-actions" style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
                                        <Link to={`/product/${watch._id}`} className="gold-button" style={{ textAlign: "center", flex: 1 }}>
                                            {isSold ? "View Details" : "Acquire Piece"}
                                        </Link>
                                        <button
                                            type="button"
                                            className="outline-button"
                                            onClick={() => handleRemove(watch._id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}

export default WishlistPage;
