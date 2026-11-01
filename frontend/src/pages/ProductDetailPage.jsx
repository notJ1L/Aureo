import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProductDetails, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
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

        const rawCart = localStorage.getItem("aureoCart");
        let cartItems = rawCart ? JSON.parse(rawCart) : [];

        const existingIndex = cartItems.findIndex((item) => item.product === product._id);

        if (existingIndex > -1) {
            if (product.condition === "second-hand" || cartItems[existingIndex].quantity >= product.stock) {
                toast.info(
                    `Cannot add more. Maximum available stock reached (${product.stock}).`
                );
                return;
            }
            cartItems[existingIndex].quantity += 1;
        } else {
            cartItems.push({
                product: product._id,
                name: product.name,
                brand: product.brand,
                price: product.price,
                image: product.images?.[0]?.url || "",
                condition: product.condition,
                stock: product.stock,
                quantity: 1
            });
        }

        localStorage.setItem("aureoCart", JSON.stringify(cartItems));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("aureo:cart-updated"));

        setAddedNotice(`${product.name} added to your bag.`);
        setTimeout(() => setAddedNotice(""), 3500);
    };

    if (loading) {
        return (
            <main className="pdp-page">
                <SiteHeader variant="solid" />
                <ProductDetailSkeleton />
                <SiteFooter />
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="pdp-page">
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
        <main className="pdp-page">
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
                                    key={selectedImage}
                                    src={images[selectedImage].url}
                                    alt={product.name}
                                    className="pdp-main-photo"
                                />
                            ) : (
                                <div className="pdp-placeholder">No photo available</div>
                            )}
                            {(isSold || isSecondHand) && (
                                <span className="pdp-tag">{isSold ? "Sold" : "Pre-owned"}</span>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="pdp-thumbs">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`pdp-thumb ${selectedImage === idx ? "is-active" : ""}`}
                                        onClick={() => setSelectedImage(idx)}
                                        aria-label={`View image ${idx + 1}`}
                                    >
                                        <img src={img.url} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="pdp-info">
                        <span className="pdp-brand">{product.brand}</span>
                        <h1 className="pdp-title">{product.name}</h1>

                        {product.numOfReviews > 0 && (
                            <div className="pdp-rating">
                                <IconStar width={14} height={14} />
                                <strong>{Number(product.ratings).toFixed(1)}</strong>
                                <span>({product.numOfReviews} reviews)</span>
                            </div>
                        )}

                        <p className="pdp-price">{formatPrice(product.price)}</p>
                        <p className={`pdp-availability ${isSold ? "is-sold" : ""}`}>{availability}</p>

                        <div className="pdp-actions">
                            <button
                                type="button"
                                className="btn-gold pdp-cta"
                                disabled={isSold}
                                onClick={handleAddToCart}
                            >
                                {isSold ? "Sold out" : "Add to bag"}
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
