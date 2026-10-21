import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createOrder, clearOrderErrors } from "../redux/actions/orderActions";
import { ORDER_CREATE_RESET } from "../redux/constants/orderConstants";

function CheckoutPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { loading, success, error, order } = useSelector((state) => state.orderCreate);

    const [cartItems] = useState(() => {
        const raw = localStorage.getItem("aureoCart");
        return raw ? JSON.parse(raw) : [];
    });

    const [shipping, setShipping] = useState({
        address: user?.address?.addressLine || "",
        city: user?.address?.city || "",
        postalCode: user?.address?.postalCode || "",
        country: user?.address?.country || "Philippines",
        phone: user?.contactNumber || ""
    });

    const [paymentMethod, setPaymentMethod] = useState("Dummy Credit Card");
    const [cardNumber, setCardNumber] = useState("4000 1234 5678 9010");
    const [cardExpiry, setCardExpiry] = useState("12/28");
    const [cardCvv, setCardCvv] = useState("888");

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate("/cart");
        }
    }, [cartItems.length, navigate]);

    useEffect(() => {
        if (success && order) {
            localStorage.removeItem("aureoCart");
            window.dispatchEvent(new Event("aureo:cart-updated"));
            dispatch({ type: ORDER_CREATE_RESET });
            navigate("/orders", { state: { newOrderPlaced: true } });
        }
    }, [success, order, navigate, dispatch]);

    useEffect(() => {
        return () => {
            dispatch(clearOrderErrors());
        };
    }, [dispatch]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleShippingChange = (e) => {
        setShipping({ ...shipping, [e.target.name]: e.target.value });
    };

    const handleSubmitOrder = (e) => {
        e.preventDefault();

        // Enforce FR 1.5: Unverified users cannot place orders
        if (!user?.isVerified) {
            alert("Email verification required: Please verify your email before placing an order (FR 1.5).");
            return;
        }

        const orderData = {
            orderItems: cartItems.map((item) => ({
                product: item.product,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            })),
            shippingInfo: {
                address: shipping.address,
                city: shipping.city,
                postalCode: shipping.postalCode,
                country: shipping.country,
                phone: shipping.phone
            },
            paymentMethod,
            cardNumber: paymentMethod === "Dummy Credit Card" ? cardNumber : undefined
        };

        dispatch(createOrder(orderData));
    };

    return (
        <main className="checkout-page">
            <header className="navbar">
                <Link className="logo" to="/">AUREO</Link>
                <div className="nav-actions">
                    <Link to="/cart" className="nav-action">← Return to Bag</Link>
                </div>
            </header>

            <div className="checkout-container">
                <div className="checkout-grid">
                    {/* Left Column: Forms */}
                    <div className="checkout-forms">
                        <p className="eyebrow">FINAL STEP</p>
                        <h1>Secure Checkout</h1>

                        {!user?.isVerified && (
                            <div className="auth-error" style={{ marginBottom: "1.5rem" }}>
                                ⚠ <strong>Account Not Verified:</strong> Per Aureo security protocol, you must verify your email before placing an acquisition order. Check your inbox or profile page.
                            </div>
                        )}

                        {error && (
                            <div className="auth-error" style={{ marginBottom: "1.5rem" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmitOrder} className="checkout-form">
                            <section className="checkout-section-box">
                                <h3>1. Delivery Information</h3>

                                <label>
                                    Street Address
                                    <input
                                        name="address"
                                        value={shipping.address}
                                        onChange={handleShippingChange}
                                        placeholder="e.g. 128 Ayala Avenue, Penthouse 4"
                                        required
                                    />
                                </label>

                                <div className="form-row-2">
                                    <label>
                                        City
                                        <input
                                            name="city"
                                            value={shipping.city}
                                            onChange={handleShippingChange}
                                            placeholder="Makati"
                                            required
                                        />
                                    </label>
                                    <label>
                                        Postal Code
                                        <input
                                            name="postalCode"
                                            value={shipping.postalCode}
                                            onChange={handleShippingChange}
                                            placeholder="1226"
                                            required
                                        />
                                    </label>
                                </div>

                                <div className="form-row-2">
                                    <label>
                                        Country
                                        <input
                                            name="country"
                                            value={shipping.country}
                                            onChange={handleShippingChange}
                                            required
                                        />
                                    </label>
                                    <label>
                                        Contact Phone
                                        <input
                                            name="phone"
                                            value={shipping.phone}
                                            onChange={handleShippingChange}
                                            placeholder="+63 917 000 0000"
                                            required
                                        />
                                    </label>
                                </div>
                            </section>

                            <section className="checkout-section-box">
                                <h3>2. Payment Method</h3>

                                <div className="payment-options">
                                    <label className={`payment-pill ${paymentMethod === "Dummy Credit Card" ? "selected" : ""}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Dummy Credit Card"
                                            checked={paymentMethod === "Dummy Credit Card"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span>Credit / Debit Card (Mock)</span>
                                    </label>

                                    <label className={`payment-pill ${paymentMethod === "E-Wallet" ? "selected" : ""}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="E-Wallet"
                                            checked={paymentMethod === "E-Wallet"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span>E-Wallet (GCash / Maya)</span>
                                    </label>

                                    <label className={`payment-pill ${paymentMethod === "Cash" ? "selected" : ""}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Cash"
                                            checked={paymentMethod === "Cash"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span>Cash on Vault Handover</span>
                                    </label>
                                </div>

                                {paymentMethod === "Dummy Credit Card" && (
                                    <div className="card-input-box">
                                        <p className="card-mock-notice">
                                            ℹ <strong>Mock Payment Engine:</strong> Any valid-format number succeeds. To test declined payment (Assumption 3), enter <code>4000 0000 0000 0002</code>.
                                        </p>

                                        <label>
                                            Card Number
                                            <input
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                                placeholder="4000 0000 0000 0000"
                                                required
                                            />
                                        </label>

                                        <div className="form-row-2">
                                            <label>
                                                Expiry Date
                                                <input
                                                    value={cardExpiry}
                                                    onChange={(e) => setCardExpiry(e.target.value)}
                                                    placeholder="MM/YY"
                                                    required
                                                />
                                            </label>
                                            <label>
                                                Security Code (CVV)
                                                <input
                                                    type="password"
                                                    maxLength={4}
                                                    value={cardCvv}
                                                    onChange={(e) => setCardCvv(e.target.value)}
                                                    placeholder="•••"
                                                    required
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <button
                                type="submit"
                                className="gold-button place-order-btn"
                                disabled={loading || !user?.isVerified}
                            >
                                {loading ? "Authorizing Acquisition..." : `Confirm & Place Acquisition (${formatPrice(subtotal)})`}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Order Summary */}
                    <aside className="checkout-summary-column">
                        <div className="cart-summary-box">
                            <h3>Order Review</h3>

                            <div className="checkout-items-list">
                                {cartItems.map((item) => (
                                    <div className="checkout-mini-item" key={item.product}>
                                        <img src={item.image} alt={item.name} className="checkout-mini-thumb" />
                                        <div className="checkout-mini-info">
                                            <h4>{item.name}</h4>
                                            <span>Qty: {item.quantity} &bull; {formatPrice(item.price)}</span>
                                        </div>
                                        <strong className="checkout-mini-price">
                                            {formatPrice(item.price * item.quantity)}
                                        </strong>
                                    </div>
                                ))}
                            </div>

                            <hr className="profile-divider" />

                            <div className="summary-row">
                                <span>Subtotal</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Armored Delivery</span>
                                <span className="free-shipping">Complimentary</span>
                            </div>

                            <hr className="profile-divider" />

                            <div className="summary-row summary-total">
                                <span>Total Acquisition Cost</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default CheckoutPage;
