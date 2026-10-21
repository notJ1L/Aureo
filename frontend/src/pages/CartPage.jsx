import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

function CartPage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const readCart = () => {
        const raw = localStorage.getItem("aureoCart");
        return raw ? JSON.parse(raw) : [];
    };

    const [cartItems, setCartItems] = useState(readCart);

    useEffect(() => {
        const handleCartUpdate = () => setCartItems(readCart());

        window.addEventListener("storage", handleCartUpdate);
        window.addEventListener("aureo:cart-updated", handleCartUpdate);

        return () => {
            window.removeEventListener("storage", handleCartUpdate);
            window.removeEventListener("aureo:cart-updated", handleCartUpdate);
        };
    }, []);

    const saveCart = (items) => {
        setCartItems(items);
        localStorage.setItem("aureoCart", JSON.stringify(items));
        window.dispatchEvent(new Event("aureo:cart-updated"));
    };

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

        const updated = cartItems.map((item) => {
            if (item.product === productId) {
                return { ...item, quantity: newQty };
            }
            return item;
        });
        saveCart(updated);
    };

    const handleRemoveItem = (productId) => {
        const updated = cartItems.filter((item) => item.product !== productId);
        saveCart(updated);
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
        <main className="cart-page">
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
                                                >
                                                    -
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.product, item.quantity + 1, item.condition, item.stock)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="cart-item-total">
                                        <strong>{formatPrice(item.price * item.quantity)}</strong>
                                        <button
                                            type="button"
                                            className="cart-remove-btn"
                                            onClick={() => handleRemoveItem(item.product)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Order Summary sidebar */}
                        <aside className="cart-summary-box">
                            <h3>Acquisition Summary</h3>
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Insured Vault Shipping</span>
                                <span className="free-shipping">Complimentary</span>
                            </div>
                            <div className="summary-row">
                                <span>Authenticity Certificate</span>
                                <span>Included</span>
                            </div>

                            <hr className="profile-divider" />

                            <div className="summary-row summary-total">
                                <span>Estimated Total</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>

                            <button
                                type="button"
                                className="gold-button checkout-btn"
                                onClick={handleProceedToCheckout}
                            >
                                Proceed to Acquisition
                            </button>

                            <Link to="/catalog" className="continue-shopping-link">
                                ← Continue exploring watches
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}

export default CartPage;
