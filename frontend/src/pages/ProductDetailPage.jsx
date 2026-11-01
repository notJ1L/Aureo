import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProductDetails, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
import { addToCart } from "../redux/actions/cartActions";
import ProductReviews from "../components/ProductReviews";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { IconHeart, IconStar } from "../components/layout/icons";
import { toast } from "react-toastify";
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
    const [addedNotice, setAddedNotice] = useState("");

    useEffect(() => {
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
        } else {
            dispatch(addToWishlist(id));
        }
    };

    const handleAddToCart = () => {
        if (!product || product.stock <= 0) return;

        const existingItem = cartItems.find((item) => item.product === product._id);

        if (existingItem) {
            if (product.condition === "second-hand" || existingItem.quantity >= product.stock) {
                toast.info(
                    `Cannot add more. Maximum available stock reached (${product.stock}).`
                );
                return;
            }
            dispatch(addToCart(product, existingItem.quantity + 1));
        } else {
            dispatch(addToCart(product, 1));
        }

        setAddedNotice(`${product.name} added to your bag.`);
        setTimeout(() => setAddedNotice(""), 3500);
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

    const availability = isSold
        ? "Sold"
        : isSecondHand
        ? "One piece available"
        : product.stock <= 3
        ? `Only ${product.stock} left`
        : "In stock";

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

                        <div className="pdp-actions">
                            <button
                                type="button"
                                className="btn-gold pdp-add"
                                onClick={handleAddToCart}
                                disabled={isSold}
                            >
                                {isSold ? "Piece Archived" : "Acquire Timepiece"}
                            </button>

                            <button
                                type="button"
                                className={`pdp-wish ${isWishlisted ? "is-active" : ""}`}
                                onClick={handleWishlistToggle}
                                aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
                                aria-pressed={!!isWishlisted}
                            >
                                <IconHeart width={18} height={18} fill={isWishlisted ? "currentColor" : "none"} />
                            </button>
                        </div>

                        {addedNotice && (
                            <p className="pdp-notice" role="status">
                                {addedNotice} <Link to="/cart">View bag</Link>
                            </p>
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
