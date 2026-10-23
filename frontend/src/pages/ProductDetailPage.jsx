import { lazy, Suspense, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProductDetails, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
import ProductReviews from "../components/ProductReviews";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import {
    IconArrow,
    IconHeart,
    IconShield,
    IconSparkle,
    IconStar,
    IconTool,
    IconWatch
} from "../components/layout/icons";
import { toast } from "react-toastify";
import "../styles/productDetail.css";

// The 3D viewer is lazy loaded so Three.js is only fetched when needed.
const ProductViewer = lazy(() => import("../components/three/ProductViewer"));

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { product, loading, error } = useSelector((state) => state.productDetails);
    const { wishlist } = useSelector((state) => state.wishlist);
    const { isAuthenticated } = useSelector((state) => state.auth);

    const [selectedImage, setSelectedImage] = useState(0);
    const [addedNotice, setAddedNotice] = useState("");
    const [showViewer, setShowViewer] = useState(false);

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

        setAddedNotice(`${product.name} added to your shopping bag.`);
        setTimeout(() => setAddedNotice(""), 3500);
    };

    if (loading) {
        return (
            <main className="pdp-page">
                <SiteHeader variant="solid" />
                <div className="pdp-loading-screen">
                    <p className="lx-kicker">ARCHIVAL RETRIEVAL</p>
                    <h2>Inspecting Timepiece in Vault...</h2>
                </div>
                <SiteFooter />
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="pdp-page">
                <SiteHeader variant="solid" />
                <div className="pdp-error-screen">
                    <p className="lx-kicker">VAULT ARCHIVE</p>
                    <h2>Timepiece Unavailable</h2>
                    <p>{error || "This specific watch may have been archived or does not exist."}</p>
                    <Link to="/catalog" className="btn-gold" style={{ marginTop: "1.5rem" }}>
                        Return to Collection <IconArrow />
                    </Link>
                </div>
                <SiteFooter />
            </main>
        );
    }

    const isSold = product.stock === 0;
    const isSecondHand = product.condition === "second-hand";

    return (
        <main className="pdp-page">
            <SiteHeader variant="solid" />

            <div className="pdp-container">
                {/* Breadcrumbs */}
                <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/">The Vault</Link>
                    <span className="separator">/</span>
                    <Link to="/catalog">Collection</Link>
                    <span className="separator">/</span>
                    <span>{product.brand}</span>
                    <span className="separator">/</span>
                    <span className="current">{product.name}</span>
                </nav>

                <div className="pdp-grid">
                    {/* Visual Stage (Sticky Left Column) */}
                    <div className="pdp-visual-stage">
                        <div className="pdp-frame">
                            {showViewer ? (
                                <Suspense
                                    fallback={
                                        <div
                                            className="product-viewer product-viewer-loading"
                                            aria-hidden="true"
                                        />
                                    }
                                >
                                    <ProductViewer productName={product.name} />
                                </Suspense>
                            ) : product.images?.[selectedImage]?.url ? (
                                <img
                                    src={product.images[selectedImage].url}
                                    alt={product.name}
                                    className="pdp-main-photo"
                                />
                            ) : (
                                <div className="detail-placeholder">Photograph Archiving in Progress</div>
                            )}

                            <span className={`pdp-badge-tag ${isSold ? "pdp-badge-tag--sold" : ""}`}>
                                {isSold
                                    ? "Archived / Sold"
                                    : isSecondHand
                                    ? "1 of 1 · Certified Pre-Owned"
                                    : "Factory Vault New"}
                            </span>
                        </div>

                        {/* Mode Switcher */}
                        <div className="pdp-view-mode-bar">
                            <button
                                type="button"
                                className={`pdp-mode-btn ${!showViewer ? "is-active" : ""}`}
                                onClick={() => setShowViewer(false)}
                                disabled={!product.images?.length}
                            >
                                Photographs ({product.images?.length || 1})
                            </button>
                            <button
                                type="button"
                                className={`pdp-mode-btn ${showViewer ? "is-active" : ""}`}
                                onClick={() => setShowViewer(true)}
                            >
                                3D Orbit Simulation ↺
                            </button>
                        </div>

                        {/* Photographs Thumbnails */}
                        {!showViewer && product.images?.length > 1 && (
                            <div className="pdp-thumbs-row">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`pdp-thumb-btn ${selectedImage === idx ? "is-active" : ""}`}
                                        onClick={() => setSelectedImage(idx)}
                                        aria-label={`View angle ${idx + 1}`}
                                    >
                                        <img src={img.url} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Information & Actions (Right Column) */}
                    <div className="pdp-info-panel">
                        <span className="pdp-brand-kicker">{product.brand} · ARCHIVAL PIECE</span>
                        <h1 className="pdp-title">{product.name}</h1>

                        <div className="pdp-meta-strip">
                            <span className="rating">
                                <IconStar /> {product.ratings ? Number(product.ratings).toFixed(1) : "5.0"}
                            </span>
                            <span>·</span>
                            <span>{product.numOfReviews || 0} Collector Reviews</span>
                            <span>·</span>
                            <span>Movement: {product.movement?.toUpperCase() || "AUTOMATIC"}</span>
                        </div>

                        {/* Price Row */}
                        <div className="pdp-price-row">
                            <div className="pdp-price-wrap">
                                <span className="pdp-price">{formatPrice(product.price)}</span>
                                <span className="pdp-price-tax">
                                    Includes complimentary insured white-glove courier &amp; vault dossier
                                </span>
                            </div>

                            <button
                                type="button"
                                className={`pdp-wishlist-toggle ${isWishlisted ? "is-active" : ""}`}
                                onClick={handleWishlistToggle}
                            >
                                <IconHeart /> {isWishlisted ? "In Wishlist" : "Wishlist"}
                            </button>
                        </div>

                        {addedNotice && (
                            <div className="pdp-notice-alert">
                                <span>{addedNotice}</span>
                                <Link to="/cart">View Shopping Bag →</Link>
                            </div>
                        )}

                        {/* Stock Banner */}
                        <div className={`pdp-stock-banner ${isSold ? "pdp-stock-banner--sold" : ""}`}>
                            {isSold ? (
                                <span>✕ This timepiece has been acquired and archived into a private collection.</span>
                            ) : isSecondHand ? (
                                <span>⚡ Singular Piece — Exactly 1 available in our vault.</span>
                            ) : (
                                <span>✓ Available in Vault — {product.stock} units ready for immediate courier dispatch.</span>
                            )}
                        </div>

                        {/* CTA Actions */}
                        <div className="pdp-actions-row">
                            <button
                                type="button"
                                className="btn-gold pdp-cta-btn"
                                disabled={isSold}
                                onClick={handleAddToCart}
                            >
                                {isSold ? "Piece Has Sold Out" : isSecondHand ? "Acquire This Unique Piece (1 of 1)" : "Add Timepiece to Bag"}
                            </button>
                            <Link to="/catalog" className="btn-ghost">
                                Explore Other Watches in Catalog <IconArrow />
                            </Link>
                        </div>

                        {/* 4-Box Luxury Assurance */}
                        <div className="pdp-assurance-grid">
                            <div className="assurance-item">
                                <IconShield />
                                <div>
                                    <strong>100% Genuine Escapement</strong>
                                    <span>Verified against manufacturer archives and international stolen registers.</span>
                                </div>
                            </div>
                            <div className="assurance-item">
                                <IconTool />
                                <div>
                                    <strong>2-Year Vault Warranty</strong>
                                    <span>Full mechanical coverage by our master watchmaking atelier.</span>
                                </div>
                            </div>
                            <div className="assurance-item">
                                <IconSparkle />
                                <div>
                                    <strong>Armored Air Courier</strong>
                                    <span>Complimentary tracked and insured delivery worldwide.</span>
                                </div>
                            </div>
                            <div className="assurance-item">
                                <IconWatch />
                                <div>
                                    <strong>Complimentary Sizing</strong>
                                    <span>Bracelet link adjustments tailored to your wrist prior to shipment.</span>
                                </div>
                            </div>
                        </div>

                        {/* Specifications Table */}
                        <section className="pdp-specs-card">
                            <h3>Chronometric Specifications</h3>
                            <dl className="pdp-specs-table">
                                <div className="pdp-spec-cell">
                                    <dt>Maison / Brand</dt>
                                    <dd>{product.brand}</dd>
                                </div>
                                <div className="pdp-spec-cell">
                                    <dt>Movement Type</dt>
                                    <dd>{product.movement?.toUpperCase() || "AUTOMATIC CHRONOMETER"}</dd>
                                </div>
                                <div className="pdp-spec-cell">
                                    <dt>Case Diameter</dt>
                                    <dd>{product.caseSize ? `${product.caseSize} mm` : "40 mm"}</dd>
                                </div>
                                <div className="pdp-spec-cell">
                                    <dt>Condition Classification</dt>
                                    <dd>{isSecondHand ? "Certified Pre-Owned (Audited)" : "Factory Brand New"}</dd>
                                </div>
                                <div className="pdp-spec-cell">
                                    <dt>Crystal &amp; Lens</dt>
                                    <dd>Anti-Reflective Scratch-Proof Sapphire</dd>
                                </div>
                                <div className="pdp-spec-cell">
                                    <dt>Vault ID</dt>
                                    <dd>{product._id.slice(-8).toUpperCase()}</dd>
                                </div>
                            </dl>
                        </section>

                        {/* Provenance & Description */}
                        <section className="pdp-description-card">
                            <h3>Provenance &amp; Description</h3>
                            <p>{product.description}</p>
                        </section>

                        {/* Product Reviews */}
                        <div className="pdp-reviews-wrap">
                            <ProductReviews
                                productId={product._id}
                                onReviewAdded={() => dispatch(getProductDetails(id))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}

export default ProductDetailPage;
