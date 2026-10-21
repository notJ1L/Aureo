import { lazy, Suspense, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getProductDetails, addToWishlist, removeFromWishlist, getWishlist } from "../redux/actions/productActions";
import ProductReviews from "../components/ProductReviews";
import { toast } from "react-toastify";

// The 3D viewer is lazy loaded, so Three.js is only fetched when the
// visitor actually asks for it.
const ProductViewer = lazy(() => import("../components/three/ProductViewer"));

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { product, loading, error } = useSelector((state) => state.productDetails);
    const { wishlist } = useSelector((state) => state.wishlist);
    const { isAuthenticated, user } = useSelector((state) => state.auth);

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

        // Retrieve existing cart items from localStorage
        const rawCart = localStorage.getItem("aureoCart");
        let cartItems = rawCart ? JSON.parse(rawCart) : [];

        // Check if item exists in cart
        const existingIndex = cartItems.findIndex((item) => item.product === product._id);

        if (existingIndex > -1) {
            // Check second hand limit (max 1) or stock
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
        // Dispatch custom storage event so other components update cart count
        window.dispatchEvent(new Event("storage"));

        setAddedNotice(`${product.name} added to your bag.`);
        setTimeout(() => setAddedNotice(""), 3000);
    };

    if (loading) {
        return (
            <main className="detail-page-loading">
                <p>Inspecting timepiece in Aureo archives...</p>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="detail-page-error">
                <h2>Timepiece Unavailable</h2>
                <p>{error || "This watch may have been archived or does not exist."}</p>
                <Link to="/catalog" className="gold-button">Return to Catalog</Link>
            </main>
        );
    }

    const isSold = product.stock === 0;
    const isSecondHand = product.condition === "second-hand";

    return (
        <main className="product-detail-page">
            <header className="navbar">
                <Link className="logo" to="/">AUREO</Link>

                <nav className="nav-links">
                    <Link to="/catalog">Collection</Link>
                    <Link to="/wishlist">Wishlist</Link>
                </nav>

                <div className="nav-actions">
                    {isAuthenticated ? (
                        <Link className="nav-action" to="/me" style={{ color: "var(--gold)" }}>
                            {user?.name?.split(" ")[0] || "Account"}
                        </Link>
                    ) : (
                        <Link className="nav-action" to="/login">Sign in</Link>
                    )}
                </div>
            </header>

            <div className="detail-breadcrumb">
                <Link to="/catalog">Collection</Link> &gt; <span>{product.brand}</span> &gt; <span>{product.name}</span>
            </div>

            <div className="product-detail-grid">
                {/* Visual Gallery */}
                <div className="detail-gallery">
                    <div className="detail-main-image-wrap">
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
                                className="detail-main-image"
                            />
                        ) : (
                            <div className="detail-placeholder">No photograph available</div>
                        )}

                        <div className="detail-badge-wrap">
                            {isSold ? (
                                <span className="badge sold-badge">ARCHIVED / SOLD</span>
                            ) : isSecondHand ? (
                                <span className="badge preowned-badge">CERTIFIED PRE-OWNED</span>
                            ) : (
                                <span className="badge new-badge">BRAND NEW</span>
                            )}
                        </div>
                    </div>

                    {/* The 3D viewer and the photograph gallery share the same
                        frame, so the visitor can switch between them. */}
                    <div className="detail-viewer-toggle">
                        <button
                            type="button"
                            className={`viewer-tab ${!showViewer ? "active" : ""}`}
                            onClick={() => setShowViewer(false)}
                            disabled={!product.images?.length}
                        >
                            Photographs
                        </button>
                        <button
                            type="button"
                            className={`viewer-tab ${showViewer ? "active" : ""}`}
                            onClick={() => setShowViewer(true)}
                        >
                            3D View
                        </button>
                    </div>

                    {!showViewer && product.images?.length > 1 && (
                        <div className="detail-thumbnails">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`thumb-btn ${selectedImage === idx ? "active" : ""}`}
                                    onClick={() => setSelectedImage(idx)}
                                >
                                    <img src={img.url} alt={`Angle ${idx + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Information & Action Area */}
                <div className="detail-content">
                    <p className="eyebrow">{product.brand} / ARCHIVAL PIECE</p>
                    <h1 className="detail-title">{product.name}</h1>

                    <div className="detail-price-row">
                        <span className="detail-price">{formatPrice(product.price)}</span>
                        <button
                            type="button"
                            className={`detail-wishlist-btn ${isWishlisted ? "active" : ""}`}
                            onClick={handleWishlistToggle}
                        >
                            {isWishlisted ? "♥ In Wishlist" : "♡ Add to Wishlist"}
                        </button>
                    </div>

                    {addedNotice && (
                        <div className="auth-info" style={{ marginTop: "1rem" }}>
                            {addedNotice} &bull; <Link to="/cart" style={{ textDecoration: "underline" }}>View Bag</Link>
                        </div>
                    )}

                    <div className="detail-actions">
                        <button
                            type="button"
                            className="gold-button detail-cta"
                            disabled={isSold}
                            onClick={handleAddToCart}
                        >
                            {isSold ? "Piece Has Sold Out" : isSecondHand ? "Acquire This Unique Piece (1 of 1)" : "Add to Shopping Bag"}
                        </button>
                        <Link to="/catalog" className="outline-button detail-secondary-cta">
                            Explore Other Watches
                        </Link>
                    </div>

                    {/* Stock Status Info */}
                    <div className="stock-notice">
                        {isSold ? (
                            <span className="stock-out">This piece is sold out and no longer available in inventory.</span>
                        ) : isSecondHand ? (
                            <span className="stock-single">⚡ Unique Piece — Exactly 1 available in our vault.</span>
                        ) : (
                            <span className="stock-in">✓ In stock ({product.stock} units available)</span>
                        )}
                    </div>

                    <hr className="profile-divider" />

                    {/* Specifications Table */}
                    <div className="specs-section">
                        <h3>Timepiece Specifications</h3>
                        <dl className="specs-grid">
                            <div>
                                <dt>Brand</dt>
                                <dd>{product.brand}</dd>
                            </div>
                            <div>
                                <dt>Movement</dt>
                                <dd>{product.movement?.toUpperCase()}</dd>
                            </div>
                            <div>
                                <dt>Case Diameter</dt>
                                <dd>{product.caseSize} mm</dd>
                            </div>
                            <div>
                                <dt>Condition</dt>
                                <dd>{product.condition === "second-hand" ? "Pre-owned / Inspected" : "Factory New"}</dd>
                            </div>
                            <div>
                                <dt>Rating</dt>
                                <dd>★ {product.ratings || 0} ({product.numOfReviews || 0} reviews)</dd>
                            </div>
                        </dl>
                    </div>

                    <hr className="profile-divider" />

                    <div className="detail-description">
                        <h3>Provenance & Description</h3>
                        <p>{product.description}</p>
                    </div>

                    <hr className="profile-divider" />

                    <ProductReviews
                        productId={product._id}
                        onReviewAdded={() => dispatch(getProductDetails(id))}
                    />
                </div>
            </div>
        </main>
    );
}

export default ProductDetailPage;
