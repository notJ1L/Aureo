import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getWishlist, removeFromWishlist } from "../redux/actions/productActions";
import { addToCart } from "../redux/actions/cartActions";
import { showNotification } from "../utils/notification";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import "../styles/aureo.css";

function WishlistPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { wishlist, loading, error } = useSelector((state) => state.wishlist);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const cartItems = useSelector((state) => state.cart?.cartItems) || [];

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

    const handleRemove = (watch) => {
        dispatch(removeFromWishlist(watch._id));
        showNotification({
            type: "wishlist",
            message: `${watch.name} removed from your wishlist.`
        });
    };

    const handleAddWatchToCart = (watch) => {
        if (!watch || watch.stock <= 0) return;
        const existing = cartItems.find((item) => item.product === watch._id);
        const currentQty = existing ? existing.quantity : 0;

        if (watch.condition === "second-hand" && currentQty >= 1) {
            showNotification({
                type: "error",
                message: "This 1-of-1 pre-owned timepiece is already in your shopping bag."
            });
            return;
        }
        if (currentQty >= watch.stock) {
            showNotification({
                type: "error",
                message: `Maximum available stock (${watch.stock}) is already in your shopping bag.`
            });
            return;
        }

        const newQty = currentQty + 1;
        dispatch(addToCart(watch, newQty));
        showNotification({
            type: "cart",
            message: `${watch.name} added to your shopping bag.`
        });
    };

    const handleBuyWatchNow = (watch) => {
        if (!watch || watch.stock <= 0) return;
        const existing = cartItems.find((item) => item.product === watch._id);
        const targetQty = existing ? existing.quantity : 1;
        dispatch(addToCart(watch, targetQty));
        navigate("/checkout");
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
                                <Link to={`/product/${watch._id}`} className="wishlist-img-wrap" style={{ display: "block" }}>
                                    {watch.images?.[0]?.url ? (
                                        <img src={watch.images[0].url} alt={watch.name} />
                                    ) : (
                                        <div className="product-placeholder">No photo</div>
                                    )}
                                    {isSold && <span className="badge sold-badge">SOLD OUT</span>}
                                </Link>

                                <div className="wishlist-details">
                                    <span className="product-brand">{watch.brand}</span>
                                    <h3>
                                        <Link to={`/product/${watch._id}`} style={{ color: "inherit", textDecoration: "none" }}>
                                            {watch.name}
                                        </Link>
                                    </h3>
                                    <p className="product-price">{formatPrice(watch.price)}</p>

                                    <div className="wishlist-card-actions" style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
                                        {!isSold ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className="outline-button"
                                                    style={{ flex: 1 }}
                                                    onClick={() => handleAddWatchToCart(watch)}
                                                >
                                                    Add to Cart
                                                </button>
                                                <button
                                                    type="button"
                                                    className="gold-button"
                                                    style={{ flex: 1 }}
                                                    onClick={() => handleBuyWatchNow(watch)}
                                                >
                                                    Buy Now
                                                </button>
                                            </>
                                        ) : (
                                            <Link to={`/product/${watch._id}`} className="outline-button" style={{ textAlign: "center", flex: 1 }}>
                                                View Details
                                            </Link>
                                        )}
                                        <button
                                            type="button"
                                            className="outline-button"
                                            onClick={() => handleRemove(watch)}
                                            title="Remove from wishlist"
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
