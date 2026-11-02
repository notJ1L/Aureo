import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProductDetails, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
import { addToCart } from "../redux/actions/cartActions";
import ProductReviews from "../components/ProductReviews";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { IconBag, IconHeart, IconStar } from "../components/layout/icons";
import { showNotification } from "../utils/notification";
import { ProductDetailSkeleton } from "../components/ui/Skeleton";
import "../styles/productDetail.css";

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { product, loading, error } = useSelector((state) => state.productDetails);
    const { wishlist } = useSelector((state) => state.wishlist);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const cartItems = useSelector((state) => state.cart?.cartItems) || [];

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedQty, setSelectedQty] = useState(1);
    const [justAdded, setJustAdded] = useState(false);
    const [addedBanner, setAddedBanner] = useState(null);

    useEffect(() => {
        setSelectedImage(0);
        setSelectedQty(1);
        setJustAdded(false);
        setAddedBanner(null);
        dispatch(getProductDetails(id));
        if (isAuthenticated) {
            dispatch(getWishlist());
        }
    }, [dispatch, id, isAuthenticated]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const isWishlisted = wishlist?.some((item) => (item._id || item) === id);

    const handleWishlistToggle = () => {
        if (!isAuthenticated) {
            navigate("/login");
            return;
        }
        if (isWishlisted) {
            dispatch(removeFromWishlist(id));
            showNotification({
                type: "wishlist",
                message: `${product?.name || "This timepiece"} removed from your wishlist.`
            });
        } else {
            dispatch(addToWishlist(id));
            showNotification({
                type: "wishlist",
                message: `${product?.name || "This timepiece"} saved to your wishlist.`
            });
        }
    };

    const existingCartItem = product
        ? cartItems.find((item) => item.product === product._id)
        : null;
    const totalBagCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddToCart = () => {
        if (!product || product.stock <= 0) return;

        const currentQty = existingCartItem ? existingCartItem.quantity : 0;
        const isPreOwned = product.condition === "second-hand";

        if (isPreOwned && currentQty >= 1) {
            showNotification({
                type: "error",
                message: "This 1-of-1 pre-owned timepiece is already in your shopping bag."
            });
            return;
        }

        const newQty = Math.min(product.stock, currentQty + selectedQty);
        if (currentQty >= product.stock) {
            showNotification({
                type: "error",
                message: `Maximum available stock (${product.stock}) is already in your shopping bag.`
            });
            return;
        }

        dispatch(addToCart(product, newQty));

        setJustAdded(true);
        setAddedBanner({
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.images?.[0]?.url,
            qtyInBag: newQty
        });

        showNotification({
            type: "cart",
            message: `${product.name} added to your shopping bag.`
        });

        setTimeout(() => setJustAdded(false), 2400);
    };

    const handleBuyNow = () => {
        if (!product || product.stock <= 0) return;

        const currentQty = existingCartItem ? existingCartItem.quantity : 0;
        const isPreOwned = product.condition === "second-hand";
        const targetQty = isPreOwned
            ? 1
            : Math.min(product.stock, Math.max(currentQty, selectedQty));

        dispatch(addToCart(product, targetQty));

        if (!isAuthenticated) {
            showNotification({
                type: "info",
                message: "Please sign in to complete your immediate checkout."
            });
            navigate("/login", { state: { from: { pathname: "/checkout" } } });
            return;
        }

        navigate("/checkout");
    };

    if (loading) {
        return (
            <main className="pdp-page page-enter">
                <SiteHeader variant="solid" />
                <ProductDetailSkeleton />
                <SiteFooter />
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="pdp-page page-enter">
                <SiteHeader variant="solid" />
                <div className="pdp-state">
                    <h1>Watch unavailable</h1>
                    <p>{error || "This watch may have been removed or does not exist."}</p>
                    <Link to="/catalog" className="btn-ghost">
                        Back to collection
                    </Link>
                </div>
                <SiteFooter />
            </main>
        );
    }

    const isSold = product.stock === 0;
    const isSecondHand = product.condition === "second-hand";
    const images = product.images || [];
    const maxSelectableQty = isSecondHand
        ? 1
        : Math.max(1, product.stock - (existingCartItem?.quantity || 0));

    const availability = isSold
        ? "Sold Out"
        : isSecondHand
        ? "1-of-1 Archival Piece"
        : product.stock <= 3
        ? `Only ${product.stock} left in vault`
        : `In Stock (${product.stock} available)`;

    return (
        <main className="pdp-page page-enter">
            <SiteHeader variant="solid" />

            <div className="pdp-container">
                <Link to="/catalog" className="pdp-back">
                    ← Collection
                </Link>

                <div className="pdp-grid">
                    {/* Gallery */}
                    <div className="pdp-gallery">
                        <div className="pdp-frame">
                            {images[selectedImage]?.url ? (
                                <img
                                    src={images[selectedImage].url}
                                    alt={`${product.name} main view`}
                                    className="pdp-main-photo"
                                />
                            ) : (
                                <div className="pdp-placeholder">No photograph available</div>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="pdp-thumbs" role="tablist">
                                {images.map((img, idx) => (
                                    <button
                                        key={img.public_id || idx}
                                        type="button"
                                        role="tab"
                                        aria-selected={idx === selectedImage}
                                        className={`pdp-thumb ${idx === selectedImage ? "is-active" : ""}`}
                                        onClick={() => setSelectedImage(idx)}
                                    >
                                        <img src={img.url} alt={`Thumbnail ${idx + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Information */}
                    <div className="pdp-info">
                        <p className="lx-kicker">{product.brand}</p>
                        <h1 className="pdp-title">{product.name}</h1>

                        <div className="pdp-rating-row">
                            <div className="pdp-rating">
                                <IconStar width={14} height={14} />
                                <span>{Number(product.ratings || 5).toFixed(1)}</span>
                            </div>
                            <span className="pdp-rating-count">
                                {product.numOfReviews || 0} {product.numOfReviews === 1 ? "review" : "reviews"}
                            </span>
                        </div>

                        <div className="pdp-price-row">
                            <span className="pdp-price">{formatPrice(product.price)}</span>
                            <span className={`pdp-badge ${isSold ? "pdp-badge--sold" : isSecondHand ? "pdp-badge--preowned" : ""}`}>
                                {availability}
                            </span>
                        </div>

                        {/* Quantity Picker for multi-unit new watches */}
                        {!isSold && !isSecondHand && product.stock > 1 && (
                            <div className="pdp-qty-row">
                                <span className="pdp-qty-label">Quantity</span>
                                <div className="pdp-qty-stepper">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                                        disabled={selectedQty <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <span>{selectedQty}</span>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedQty((q) => Math.min(maxSelectableQty, q + 1))}
                                        disabled={selectedQty >= maxSelectableQty}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                                {existingCartItem && (
                                    <span className="pdp-in-bag-pill">
                                        {existingCartItem.quantity} currently in your bag
                                    </span>
                                )}
                            </div>
                        )}

                        {!isSold && isSecondHand && existingCartItem && (
                            <div className="pdp-qty-row">
                                <span className="pdp-in-bag-pill">
                                    ✓ Reserved in your shopping bag (1 of 1)
                                </span>
                            </div>
                        )}

                        {/* Dual Action Buttons: Add to Cart + Buy Now + Wishlist */}
                        <div className="pdp-actions">
                            <button
                                type="button"
                                className={`pdp-btn-cart ${justAdded ? "is-added" : ""}`}
                                onClick={handleAddToCart}
                                disabled={isSold}
                            >
                                <IconBag width={17} height={17} />
                                <span>
                                    {isSold
                                        ? "Unavailable"
                                        : justAdded
                                        ? "✓ Added to Cart"
                                        : "Add to Cart"}
                                </span>
                            </button>

                            <button
                                type="button"
                                className="btn-gold pdp-btn-buy"
                                onClick={handleBuyNow}
                                disabled={isSold}
                            >
                                {isSold ? "Piece Archived" : "Buy Now"}
                            </button>

                            <button
                                type="button"
                                className={`pdp-wish ${isWishlisted ? "is-active" : ""}`}
                                onClick={handleWishlistToggle}
                                aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                                aria-pressed={!!isWishlisted}
                                title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                            >
                                <IconHeart width={18} height={18} fill={isWishlisted ? "currentColor" : "none"} />
                            </button>
                        </div>

                        {/* Rich Inline Confirmation Banner when Added to Cart */}
                        {addedBanner && (
                            <div className="pdp-cart-banner" role="status" aria-live="polite">
                                <div className="pdp-cart-banner__top">
                                    <div className="pdp-cart-banner__left">
                                        <span className="pdp-cart-banner__badge">✓</span>
                                        <div>
                                            <strong className="pdp-cart-banner__title">
                                                Added to Your Shopping Bag
                                            </strong>
                                            <span className="pdp-cart-banner__sub">
                                                {addedBanner.name} &bull; {addedBanner.qtyInBag}{" "}
                                                {addedBanner.qtyInBag === 1 ? "piece" : "pieces"} in bag (
                                                {formatPrice(addedBanner.price * addedBanner.qtyInBag)})
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="pdp-cart-banner__close"
                                        onClick={() => setAddedBanner(null)}
                                        aria-label="Dismiss notification"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="pdp-cart-banner__actions">
                                    <Link to="/cart" className="pdp-cart-banner__link-bag">
                                        View Bag ({totalBagCount})
                                    </Link>
                                    <button
                                        type="button"
                                        className="pdp-cart-banner__link-checkout"
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                navigate("/login", { state: { from: { pathname: "/checkout" } } });
                                            } else {
                                                navigate("/checkout");
                                            }
                                        }}
                                    >
                                        Checkout Now →
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="pdp-assurance-matrix">
                            <div className="pdp-assurance-item">
                                <span className="pdp-assurance-dot" />
                                <div>
                                    <strong>100% Provenance Verified</strong>
                                    <span>Tested across 5 positions in Geneva suite</span>
                                </div>
                            </div>
                            <div className="pdp-assurance-item">
                                <span className="pdp-assurance-dot" />
                                <div>
                                    <strong>2-Year Maison Warranty</strong>
                                    <span>Full movement and escapement coverage</span>
                                </div>
                            </div>
                            <div className="pdp-assurance-item">
                                <span className="pdp-assurance-dot" />
                                <div>
                                    <strong>Insured Armored Courier</strong>
                                    <span>Door-to-door high-security transit</span>
                                </div>
                            </div>
                            <div className="pdp-assurance-item">
                                <span className="pdp-assurance-dot" />
                                <div>
                                    <strong>Vault Escrow Protection</strong>
                                    <span>Funds protected until physical inspection</span>
                                </div>
                            </div>
                        </div>

                        <dl className="pdp-specs">
                            <div>
                                <dt>Brand</dt>
                                <dd>{product.brand}</dd>
                            </div>
                            <div>
                                <dt>Movement</dt>
                                <dd className="cap">{product.movement || "Automatic"}</dd>
                            </div>
                            <div>
                                <dt>Case size</dt>
                                <dd>{product.caseSize ? `${product.caseSize} mm` : "—"}</dd>
                            </div>
                            <div>
                                <dt>Condition</dt>
                                <dd>{isSecondHand ? "Pre-owned" : "New"}</dd>
                            </div>
                        </dl>

                        {product.description && <p className="pdp-description">{product.description}</p>}
                    </div>
                </div>

                <div className="pdp-reviews">
                    <ProductReviews
                        productId={product._id}
                        onReviewAdded={() => dispatch(getProductDetails(id))}
                    />
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}

export default ProductDetailPage;
