import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateCartQuantity, removeFromCart, clearCart } from "../redux/actions/cartActions";
import { addToWishlist } from "../redux/actions/productActions";
import { confirmAction } from "../utils/sweetAlert";
import { showNotification } from "../utils/notification";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import {
    IconArrow,
    IconBag,
    IconHeart,
    IconShield,
    IconSparkle,
    IconTruck,
    IconWatch
} from "../components/layout/icons";

function CartPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isAuthenticated } = useSelector((state) => state.auth);
    const cartItems = useSelector((state) => state.cart?.cartItems) || [];

    const handleQuantityChange = (productId, newQty, condition, stock) => {
        if (newQty < 1) return;
        if (condition === "second-hand" && newQty > 1) {
            showNotification({
                type: "error",
                message: "This certified pre-owned timepiece is a unique archival piece (maximum 1)."
            });
            return;
        }
        if (newQty > stock) {
            showNotification({
                type: "error",
                message: `Maximum stock available in vault is ${stock}.`
            });
            return;
        }

        dispatch(updateCartQuantity(productId, newQty));
    };

    const handleRemoveItem = (item) => {
        dispatch(removeFromCart(item.product));
        showNotification({
            type: "cart",
            message: `${item.name} removed from your shopping bag.`
        });
    };

    const handleMoveToWishlist = (item) => {
        if (!isAuthenticated) {
            showNotification({
                type: "info",
                message: "Please sign in to save timepieces to your wishlist."
            });
            navigate("/login", { state: { from: { pathname: "/cart" } } });
            return;
        }
        dispatch(addToWishlist(item.product));
        dispatch(removeFromCart(item.product));
        showNotification({
            type: "wishlist",
            message: `${item.name} moved to your wishlist.`
        });
    };

    const handleClearBag = async () => {
        const confirmed = await confirmAction({
            title: "Clear your shopping bag?",
            message: "All selected timepieces will be removed from your bag.",
            confirmText: "Clear Bag",
            danger: true
        });
        if (confirmed) {
            dispatch(clearCart());
            showNotification({
                type: "info",
                message: "Shopping bag cleared."
            });
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const totalUnits = cartItems.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleProceedToCheckout = () => {
        if (!isAuthenticated) {
            showNotification({
                type: "info",
                message: "Please sign in to proceed to secure checkout."
            });
            navigate("/login", { state: { from: { pathname: "/checkout" } } });
            return;
        }
        navigate("/checkout");
    };

    return (
        <main className="cart-page page-enter">
            <SiteHeader variant="solid" />

            <div className="cart-container">
                {/* Top Header */}
                <div className="cart-header">
                    <div className="cart-header__left">
                        <Link to="/catalog" className="cart-back-link">
                            ← Continue Exploring Collection
                        </Link>
                        <div className="cart-title-row">
                            <div>
                                <p className="eyebrow">YOUR VAULT SELECTION</p>
                                <h1>Shopping Bag</h1>
                            </div>
                            {cartItems.length > 0 && (
                                <span className="cart-count-pill">
                                    {cartItems.length} {cartItems.length === 1 ? "Reference" : "References"} &bull;{" "}
                                    {totalUnits} {totalUnits === 1 ? "Timepiece" : "Timepieces"}
                                </span>
                            )}
                        </div>
                    </div>

                    {cartItems.length > 0 && (
                        <button
                            type="button"
                            className="cart-clear-btn"
                            onClick={handleClearBag}
                        >
                            Clear Bag
                        </button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <div className="cart-empty-vault">
                        <div className="cart-empty-vault__icon">
                            <IconBag width={28} height={28} />
                        </div>
                        <h2>Your Shopping Bag Is Empty</h2>
                        <p>
                            Explore our curated vault of chronometer-certified and archival 1-of-1 timepieces to begin your acquisition.
                        </p>
                        <div className="cart-empty-vault__actions">
                            <Link to="/catalog" className="btn-gold">
                                Explore Timepiece Collection <IconArrow />
                            </Link>
                            {isAuthenticated && (
                                <Link to="/wishlist" className="btn-ghost">
                                    View Saved Wishlist
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="cart-grid">
                        {/* Left Column: Selected Timepieces */}
                        <div className="cart-items-column">
                            {cartItems.map((item) => {
                                const isPreOwned = item.condition === "second-hand";
                                const lineTotal = item.price * item.quantity;

                                return (
                                    <article className="cart-item-card" key={item.product}>
                                        <Link
                                            to={`/product/${item.product}`}
                                            className="cart-thumb-frame"
                                            aria-label={`View ${item.name}`}
                                        >
                                            <img
                                                src={
                                                    item.image ||
                                                    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=240&q=80"
                                                }
                                                alt={item.name}
                                                className="cart-thumb"
                                            />
                                        </Link>

                                        <div className="cart-item-body">
                                            <div className="cart-item-top">
                                                <div className="cart-item-meta">
                                                    <div className="cart-item-brand-row">
                                                        <span className="cart-item-brand">{item.brand}</span>
                                                        <span
                                                            className={`cart-condition-pill ${
                                                                isPreOwned
                                                                    ? "cart-condition-pill--preowned"
                                                                    : "cart-condition-pill--new"
                                                            }`}
                                                        >
                                                            {isPreOwned ? "Vault 1-of-1 Pre-Owned" : "Brand New"}
                                                        </span>
                                                    </div>

                                                    <h3 className="cart-item-title">
                                                        <Link to={`/product/${item.product}`}>{item.name}</Link>
                                                    </h3>

                                                    <p className="cart-unit-price">
                                                        {formatPrice(item.price)} per timepiece
                                                        {!isPreOwned && item.stock > 0 && (
                                                            <span className="cart-stock-note">
                                                                {" "}
                                                                &bull; {item.stock} available in vault
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="cart-item-total">
                                                    <span className="cart-item-total__label">Subtotal</span>
                                                    <strong className="cart-item-total__amount">
                                                        {formatPrice(lineTotal)}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="cart-item-perks">
                                                <span>
                                                    <IconShield width={13} height={13} /> 5-Position Geneva Audit
                                                </span>
                                                <span>
                                                    <IconTruck width={13} height={13} /> Complimentary Armored Courier
                                                </span>
                                            </div>

                                            <div className="cart-item-footer">
                                                <div className="cart-qty-controls">
                                                    {isPreOwned ? (
                                                        <span className="single-unit-indicator">
                                                            ✦ Unique Archival Piece (Qty: 1)
                                                        </span>
                                                    ) : (
                                                        <div className="cart-qty-stepper">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleQuantityChange(
                                                                        item.product,
                                                                        item.quantity - 1,
                                                                        item.condition,
                                                                        item.stock
                                                                    )
                                                                }
                                                                disabled={item.quantity <= 1}
                                                                aria-label="Decrease quantity"
                                                            >
                                                                −
                                                            </button>
                                                            <span>{item.quantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleQuantityChange(
                                                                        item.product,
                                                                        item.quantity + 1,
                                                                        item.condition,
                                                                        item.stock
                                                                    )
                                                                }
                                                                disabled={item.quantity >= item.stock}
                                                                aria-label="Increase quantity"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="cart-item-actions">
                                                    <button
                                                        type="button"
                                                        className="cart-action-btn cart-action-btn--wishlist"
                                                        onClick={() => handleMoveToWishlist(item)}
                                                        title="Move to wishlist"
                                                    >
                                                        <IconHeart width={14} height={14} />
                                                        <span>Save for Later</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="cart-action-btn cart-action-btn--remove"
                                                        onClick={() => handleRemoveItem(item)}
                                                    >
                                                        <span>✕ Remove</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {/* Right Column: Sticky Acquisition Summary Sidebar */}
                        <aside className="cart-summary-column">
                            <div className="cart-summary-box">
                                <div className="cart-summary-head">
                                    <span className="cart-summary-kicker">ESCROW SETTLEMENT</span>
                                    <h3>Acquisition Summary</h3>
                                </div>

                                <div className="cart-summary-rows">
                                    <div className="summary-row">
                                        <span>
                                            Timepieces ({totalUnits} {totalUnits === 1 ? "pc" : "pcs"})
                                        </span>
                                        <strong>{formatPrice(subtotal)}</strong>
                                    </div>

                                    <div className="summary-row">
                                        <span>Armored Insured Transit</span>
                                        <span className="summary-complimentary">Complimentary</span>
                                    </div>

                                    <div className="summary-row">
                                        <span>Escrow &amp; Authentication</span>
                                        <span className="summary-complimentary">Included</span>
                                    </div>

                                    <div className="summary-row">
                                        <span>2-Year Maison Warranty</span>
                                        <span className="summary-complimentary">Included</span>
                                    </div>
                                </div>

                                <hr className="summary-divider" />

                                <div className="summary-row summary-total">
                                    <div>
                                        <span className="summary-total__label">Estimated Total</span>
                                        <small className="summary-total__tax">Taxes &amp; duties included</small>
                                    </div>
                                    <strong className="summary-total__value">{formatPrice(subtotal)}</strong>
                                </div>

                                <button
                                    type="button"
                                    className="btn-gold cart-checkout-cta"
                                    onClick={handleProceedToCheckout}
                                >
                                    <span>Proceed to Secure Checkout</span>
                                    <IconArrow width={16} height={16} />
                                </button>

                                <Link to="/catalog" className="cart-continue-btn">
                                    Continue Shopping
                                </Link>

                                <div className="cart-trust-list">
                                    <div className="cart-trust-item">
                                        <IconShield width={15} height={15} />
                                        <span>256-Bit Encrypted Vault Escrow Settlement</span>
                                    </div>
                                    <div className="cart-trust-item">
                                        <IconWatch width={15} height={15} />
                                        <span>Physical In-House Movement &amp; Amplitude Audit</span>
                                    </div>
                                    <div className="cart-trust-item">
                                        <IconSparkle width={15} height={15} />
                                        <span>Official Provenance Certificate &amp; PDF Dossier</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>

            <SiteFooter />
        </main>
    );
}

export default CartPage;
