import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { updateCartQuantity, removeFromCart } from "../redux/actions/cartActions";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

function CartPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { isAuthenticated } = useSelector((state) => state.auth);
    const cartItems = useSelector((state) => state.cart?.cartItems) || [];

    const handleQuantityChange = (productId, newQty, condition, stock) => {
        if (newQty < 1) return;
        if (condition === "second-hand" && newQty > 1) {
            toast.error("This certified pre-owned timepiece is a unique archival piece (maximum 1).");
            return;
        }
        if (newQty > stock) {
            toast.error(`Maximum stock available in vault is ${stock}.`);
            return;
        }

        dispatch(updateCartQuantity(productId, newQty));
    };

    const handleRemoveItem = (productId) => {
        dispatch(removeFromCart(productId));
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleProceedToCheckout = () => {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: { pathname: "/checkout" } } });
            return;
        }
        navigate("/checkout");
    };

    return (
        <main className="cart-page page-enter">
            <SiteHeader variant="solid" />

            <div className="cart-container">
                <div className="cart-header">
                    <p className="eyebrow">YOUR VAULT SELECTION</p>
                    <h1>Shopping Bag</h1>
                </div>

                {cartItems.length === 0 ? (
                    <div className="empty-state">
                        <p>Your shopping bag is currently empty.</p>
                        <span>Select a timepiece from our collection to begin your acquisition.</span>
                        <Link to="/catalog" className="gold-button" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                            Explore Timepiece Collection
                        </Link>
                    </div>
                ) : (
                    <div className="cart-grid">
                        <div className="cart-items-column">
                            {cartItems.map((item) => (
                                <article className="cart-item-card" key={item.product}>
                                    <img
                                        src={item.image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=150&q=80"}
                                        alt={item.name}
                                        className="cart-thumb"
                                    />

                                    <div className="cart-item-meta">
                                        <span className="product-brand">{item.brand}</span>
                                        <h3 className="cart-item-title">
                                            <Link to={`/product/${item.product}`}>{item.name}</Link>
                                        </h3>
                                        <span className={`badge ${item.condition === "second-hand" ? "preowned-badge" : "new-badge"}`}>
                                            {item.condition === "second-hand" ? "Pre-owned (1 of 1)" : "Brand New"}
                                        </span>
                                        <p className="cart-unit-price">{formatPrice(item.price)}</p>
                                    </div>

                                    <div className="cart-qty-controls">
                                        {item.condition === "second-hand" ? (
                                            <span className="single-unit-indicator">Qty: 1</span>
                                        ) : (
                                            <div className="qty-picker">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.product, item.quantity - 1, item.condition, item.stock)}
                                                    disabled={item.quantity <= 1}
                                                    aria-label="Decrease quantity"
                                                >
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.product, item.quantity + 1, item.condition, item.stock)}
                                                    disabled={item.quantity >= item.stock}
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            className="cart-remove-link"
                                            onClick={() => handleRemoveItem(item.product)}
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="cart-item-total">
                                        <strong>{formatPrice(item.price * item.quantity)}</strong>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Order Summary Sidebar */}
                        <aside className="cart-summary-column">
                            <div className="cart-summary-box">
                                <h3>Acquisition Summary</h3>

                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <strong>{formatPrice(subtotal)}</strong>
                                </div>

                                <div className="summary-row">
                                    <span>Armored Insured Transit</span>
                                    <span className="free-shipping">Complimentary</span>
                                </div>

                                <div className="summary-row">
                                    <span>Escrow &amp; Authentication</span>
                                    <span className="free-shipping">Included</span>
                                </div>

                                <hr className="summary-divider" />

                                <div className="summary-row summary-total">
                                    <span>Estimated Total</span>
                                    <strong style={{ color: "var(--gold)" }}>{formatPrice(subtotal)}</strong>
                                </div>

                                <button
                                    type="button"
                                    className="gold-button checkout-proceed-btn"
                                    onClick={handleProceedToCheckout}
                                >
                                    Proceed to Secure Checkout →
                                </button>

                                <p className="secure-badge-note">
                                    🔒 256-Bit Encrypted Settlement &bull; Physical In-House Movement Audit
                                </p>
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
