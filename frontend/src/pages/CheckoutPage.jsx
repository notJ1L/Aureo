import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { createOrder, clearOrderErrors } from "../redux/actions/orderActions";
import { clearCart } from "../redux/actions/cartActions";
import { ORDER_CREATE_RESET } from "../redux/constants/orderConstants";
import { checkoutSchema } from "../utils/validationSchemas";
import { toast } from "react-toastify";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

function CheckoutPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { loading, success, error, order } = useSelector((state) => state.orderCreate);
    const cartItems = useSelector((state) => state.cart?.cartItems) || [];

    const [paymentMethod, setPaymentMethod] = useState("Dummy Credit Card");
    const [cardNumber, setCardNumber] = useState("4000 1234 5678 9010");
    const [cardExpiry, setCardExpiry] = useState("12/28");
    const [cardCvv, setCardCvv] = useState("888");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(checkoutSchema),
        mode: "onBlur",
        defaultValues: {
            addressLine: user?.address?.addressLine || "",
            city: user?.address?.city || "",
            postalCode: user?.address?.postalCode || "",
            country: user?.address?.country || "Philippines",
            contactNumber: user?.contactNumber || ""
        }
    });

    useEffect(() => {
        if (user) {
            reset({
                addressLine: user.address?.addressLine || "",
                city: user.address?.city || "",
                postalCode: user.address?.postalCode || "",
                country: user.address?.country || "Philippines",
                contactNumber: user.contactNumber || ""
            });
        }
    }, [user, reset]);

    useEffect(() => {
        if (cartItems.length === 0 && !success) {
            navigate("/cart");
        }
    }, [cartItems.length, success, navigate]);

    useEffect(() => {
        if (success && order) {
            dispatch(clearCart());
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

    const onSubmit = (data) => {
        if (!user?.isVerified) {
            toast.error(
                "Email verification required: please verify your email before placing an order."
            );
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
                address: data.addressLine,
                city: data.city,
                postalCode: data.postalCode,
                country: data.country,
                phone: data.contactNumber
            },
            paymentMethod,
            cardNumber: paymentMethod === "Dummy Credit Card" ? cardNumber : undefined
        };

        dispatch(createOrder(orderData));
    };

    return (
        <main className="checkout-page page-enter">
            <SiteHeader variant="solid" />

            <div className="checkout-container">
                <div className="checkout-grid">
                    {/* Left Column: Forms */}
                    <div className="checkout-forms">
                        <div>
                            <p className="eyebrow">FINAL STEP</p>
                            <h1>Secure Acquisition Checkout</h1>
                            <p className="auth-description">
                                Finalize destination and escrow settlement. Every timepiece is hand-audited before release.
                            </p>
                        </div>

                        {!user?.isVerified && (
                            <div className="auth-error" style={{ marginBottom: "1.5rem" }}>
                                ⚠ <strong>Account Not Verified:</strong> Per Aureo security protocol, you must verify your email before placing an acquisition order. Check your inbox or profile page.
                            </div>
                        )}

                        {error && (
                            <div className="auth-error" style={{ marginBottom: "1.5rem" }}>
                                <strong>Checkout Error:</strong> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="checkout-form">
                            <section className="checkout-section-box">
                                <h3>1. Delivery Information</h3>

                                <label>
                                    Street Address
                                    <input
                                        {...register("addressLine")}
                                        placeholder="e.g. 128 Ayala Avenue, Penthouse 4"
                                        aria-invalid={Boolean(errors.addressLine)}
                                    />
                                    {errors.addressLine && <span className="field-error">{errors.addressLine.message}</span>}
                                </label>

                                <div className="form-row-2">
                                    <label>
                                        City
                                        <input
                                            {...register("city")}
                                            placeholder="Makati"
                                            aria-invalid={Boolean(errors.city)}
                                        />
                                        {errors.city && <span className="field-error">{errors.city.message}</span>}
                                    </label>
                                    <label>
                                        Postal Code
                                        <input
                                            {...register("postalCode")}
                                            placeholder="1226"
                                            aria-invalid={Boolean(errors.postalCode)}
                                        />
                                        {errors.postalCode && <span className="field-error">{errors.postalCode.message}</span>}
                                    </label>
                                </div>

                                <div className="form-row-2">
                                    <label>
                                        Country
                                        <input
                                            {...register("country")}
                                            aria-invalid={Boolean(errors.country)}
                                        />
                                        {errors.country && <span className="field-error">{errors.country.message}</span>}
                                    </label>
                                    <label>
                                        Contact Phone
                                        <input
                                            {...register("contactNumber")}
                                            placeholder="+63 917 123 4567"
                                            aria-invalid={Boolean(errors.contactNumber)}
                                        />
                                        {errors.contactNumber && <span className="field-error">{errors.contactNumber.message}</span>}
                                    </label>
                                </div>
                            </section>

                            <section className="checkout-section-box">
                                <h3>2. Settlement &amp; Escrow Method</h3>

                                <div className="payment-options">
                                    <label className={`payment-pill ${paymentMethod === "Dummy Credit Card" ? "active" : ""}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Dummy Credit Card"
                                            checked={paymentMethod === "Dummy Credit Card"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span>💳 Dummy Credit Card (Mock Sandbox)</span>
                                    </label>
                                    <label className={`payment-pill ${paymentMethod === "Cash" ? "active" : ""}`}>
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Cash"
                                            checked={paymentMethod === "Cash"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span>💵 Wire Settlement / Armored Cash on Delivery</span>
                                    </label>
                                </div>

                                {paymentMethod === "Dummy Credit Card" && (
                                    <div className="credit-card-mock-box" style={{ marginTop: "1.2rem", padding: "1.2rem", background: "var(--bg-elevated)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                                            <strong style={{ fontSize: "0.85rem", color: "var(--gold)" }}>Test Card Numbers:</strong>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    type="button"
                                                    className="outline-button"
                                                    style={{ minHeight: "28px", padding: "0 0.6rem", fontSize: "0.72rem" }}
                                                    onClick={() => setCardNumber("4000 1234 5678 9010")}
                                                >
                                                    Use Valid Card (Succeeds)
                                                </button>
                                                <button
                                                    type="button"
                                                    className="outline-button"
                                                    style={{ minHeight: "28px", padding: "0 0.6rem", fontSize: "0.72rem", borderColor: "var(--danger)", color: "var(--danger)" }}
                                                    onClick={() => setCardNumber("4000 0000 0000 0002")}
                                                >
                                                    Use Declining Card (Fails)
                                                </button>
                                            </div>
                                        </div>

                                        <label>
                                            Card Number
                                            <input
                                                type="text"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                                placeholder="4000 1234 5678 9010"
                                                required
                                            />
                                        </label>

                                        <div className="form-row-2" style={{ marginTop: "0.8rem" }}>
                                            <label>
                                                Expiry Date
                                                <input
                                                    type="text"
                                                    value={cardExpiry}
                                                    onChange={(e) => setCardExpiry(e.target.value)}
                                                    placeholder="MM/YY"
                                                    required
                                                />
                                            </label>
                                            <label>
                                                Security Code (CVV)
                                                <input
                                                    type="text"
                                                    value={cardCvv}
                                                    onChange={(e) => setCardCvv(e.target.value)}
                                                    placeholder="888"
                                                    required
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <button
                                type="submit"
                                className="gold-button order-submit-btn"
                                disabled={loading || !user?.isVerified}
                                style={{ width: "100%", minHeight: "50px", fontSize: "0.95rem" }}
                            >
                                {loading ? "Authorizing Acquisition..." : `Confirm Acquisition — ${formatPrice(subtotal)}`}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Order Summary */}
                    <aside className="checkout-summary-column">
                        <div className="checkout-summary-box checkout-section-box">
                            <h3>Acquisition Summary</h3>

                            <div className="checkout-items-list">
                                {cartItems.map((item) => (
                                    <div className="checkout-mini-item" key={item.product} style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                                        <img src={item.image} alt={item.name} className="mini-thumb" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ fontSize: "0.85rem", display: "block" }}>{item.name}</strong>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                Qty {item.quantity} &bull; {formatPrice(item.price)}
                                            </span>
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                                            {formatPrice(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <hr className="profile-divider" />

                            <div className="summary-row">
                                <span>Subtotal</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>

                            <div className="summary-row">
                                <span>Armored Transport</span>
                                <span className="free-shipping">Complimentary</span>
                            </div>

                            <div className="summary-row">
                                <span>Maison Certification</span>
                                <span className="free-shipping">Included</span>
                            </div>

                            <hr className="profile-divider" />

                            <div className="summary-row summary-total" style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
                                <span>Total Settlement</span>
                                <strong style={{ color: "var(--gold)" }}>{formatPrice(subtotal)}</strong>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}

export default CheckoutPage;
