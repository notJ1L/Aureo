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
import {
    IconArrow,
    IconShield,
    IconSparkle,
    IconTruck,
    IconWatch
} from "../components/layout/icons";

function CheckoutPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { loading, success, error, order } = useSelector((state) => state.orderCreate);
    const cartItems = useSelector((state) => state.cart?.cartItems) || [];

    const [paymentMethod, setPaymentMethod] = useState("Dummy Credit Card");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [orderCreateReady, setOrderCreateReady] = useState(false);

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
        dispatch({ type: ORDER_CREATE_RESET });
        setOrderCreateReady(true);
    }, [dispatch]);

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
        if (orderCreateReady && cartItems.length === 0 && !success && !order) {
            navigate("/cart");
        }
    }, [cartItems.length, success, order, navigate, orderCreateReady]);

    useEffect(() => {
        if (orderCreateReady && success && order) {
            reset({
                addressLine: "",
                city: "",
                postalCode: "",
                country: "Philippines",
                contactNumber: ""
            });
            setPaymentMethod("Dummy Credit Card");
            setCardNumber("");
            setCardExpiry("");
            setCardCvv("");
            dispatch(clearCart());
            navigate(`/order/success/${order._id}`);
        }
    }, [success, order, navigate, dispatch, reset, orderCreateReady]);

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

    const totalUnits = cartItems.reduce((acc, item) => acc + item.quantity, 0);
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
                {/* Top Header Bar */}
                <div className="checkout-header">
                    <Link to="/cart" className="cart-back-link">
                        ← Return to Shopping Bag
                    </Link>
                    <div className="checkout-title-row">
                        <div>
                            <p className="eyebrow">FINAL STEP</p>
                            <h1>Secure Acquisition Checkout</h1>
                            <p className="checkout-lead">
                                Finalize destination and escrow settlement. Every timepiece is hand-audited in our Geneva-standard suite before release.
                            </p>
                        </div>
                    </div>
                </div>

                {!user?.isVerified && (
                    <div className="auth-error" style={{ marginBottom: "1.5rem" }}>
                        <strong>Account Not Verified:</strong> Per Aureo security protocol, you must verify your email before placing an acquisition order. Check your inbox or profile page.
                    </div>
                )}

                {error && (
                    <div className="auth-error" style={{ marginBottom: "1.5rem" }}>
                        <strong>Checkout Error:</strong> {error}
                    </div>
                )}

                <div className="checkout-grid">
                    {/* Left Column: Checkout Form */}
                    <div className="checkout-forms">
                        <form onSubmit={handleSubmit(onSubmit)} className="checkout-form" noValidate>
                            {/* Section 1: Delivery Information */}
                            <section className="checkout-section-box">
                                <div className="checkout-section-head">
                                    <span className="checkout-step-badge">01</span>
                                    <div>
                                        <h3>Delivery Information</h3>
                                        <p className="checkout-section-sub">
                                            Armored insured courier dispatches directly to your designated vault or residence.
                                        </p>
                                    </div>
                                </div>

                                <div className="checkout-fields-stack">
                                    <div className="checkout-field">
                                        <label htmlFor="checkout-addressLine">Street Address</label>
                                        <input
                                            id="checkout-addressLine"
                                            {...register("addressLine")}
                                            placeholder="e.g. 128 Ayala Avenue, Penthouse 4"
                                            aria-invalid={Boolean(errors.addressLine)}
                                        />
                                        {errors.addressLine && (
                                            <span className="field-error">{errors.addressLine.message}</span>
                                        )}
                                    </div>

                                    <div className="checkout-form-row-2">
                                        <div className="checkout-field">
                                            <label htmlFor="checkout-city">City</label>
                                            <input
                                                id="checkout-city"
                                                {...register("city")}
                                                placeholder="Makati"
                                                aria-invalid={Boolean(errors.city)}
                                            />
                                            {errors.city && (
                                                <span className="field-error">{errors.city.message}</span>
                                            )}
                                        </div>

                                        <div className="checkout-field">
                                            <label htmlFor="checkout-postalCode">Postal Code</label>
                                            <input
                                                id="checkout-postalCode"
                                                {...register("postalCode")}
                                                placeholder="1226"
                                                aria-invalid={Boolean(errors.postalCode)}
                                            />
                                            {errors.postalCode && (
                                                <span className="field-error">{errors.postalCode.message}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="checkout-form-row-2">
                                        <div className="checkout-field">
                                            <label htmlFor="checkout-country">Country</label>
                                            <input
                                                id="checkout-country"
                                                {...register("country")}
                                                placeholder="Philippines"
                                                aria-invalid={Boolean(errors.country)}
                                            />
                                            {errors.country && (
                                                <span className="field-error">{errors.country.message}</span>
                                            )}
                                        </div>

                                        <div className="checkout-field">
                                            <label htmlFor="checkout-contactNumber">Contact Phone</label>
                                            <input
                                                id="checkout-contactNumber"
                                                {...register("contactNumber")}
                                                placeholder="+63 917 123 4567"
                                                aria-invalid={Boolean(errors.contactNumber)}
                                            />
                                            {errors.contactNumber && (
                                                <span className="field-error">{errors.contactNumber.message}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Settlement & Escrow Method */}
                            <section className="checkout-section-box">
                                <div className="checkout-section-head">
                                    <span className="checkout-step-badge">02</span>
                                    <div>
                                        <h3>Settlement &amp; Escrow Method</h3>
                                        <p className="checkout-section-sub">
                                            Funds are held in Aureo Vault Escrow until physical inspection upon delivery.
                                        </p>
                                    </div>
                                </div>

                                <div className="payment-options">
                                    <label
                                        className={`payment-pill ${
                                            paymentMethod === "Dummy Credit Card" ? "active" : ""
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Dummy Credit Card"
                                            checked={paymentMethod === "Dummy Credit Card"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <div className="payment-pill__content">
                                            <strong className="payment-pill__title">
                                                Credit / Private Client Card (Sandbox)
                                            </strong>
                                            <span className="payment-pill__desc">
                                                Instant escrow authorization with 256-bit encryption.
                                            </span>
                                        </div>
                                    </label>

                                    <label
                                        className={`payment-pill ${
                                            paymentMethod === "Cash" ? "active" : ""
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Cash"
                                            checked={paymentMethod === "Cash"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <div className="payment-pill__content">
                                            <strong className="payment-pill__title">
                                                Wire Settlement / Armored Cash on Delivery
                                            </strong>
                                            <span className="payment-pill__desc">
                                                Settle via direct bank wire or upon armored courier handover.
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                {paymentMethod === "Dummy Credit Card" && (
                                    <div className="checkout-card-sandbox">
                                        <div className="checkout-card-sandbox__bar">
                                            <span className="checkout-card-sandbox__label">
                                                Sandbox Test Presets:
                                            </span>
                                            <div className="checkout-card-sandbox__btns">
                                                <button
                                                    type="button"
                                                    className={`sandbox-preset-btn ${
                                                        cardNumber === "4000 1234 5678 9010"
                                                            ? "is-selected"
                                                            : ""
                                                    }`}
                                                    onClick={() => setCardNumber("4000 1234 5678 9010")}
                                                >
                                                    ✓ Valid Card (Succeeds)
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`sandbox-preset-btn sandbox-preset-btn--danger ${
                                                        cardNumber === "4000 0000 0000 0002"
                                                            ? "is-selected"
                                                            : ""
                                                    }`}
                                                    onClick={() => setCardNumber("4000 0000 0000 0002")}
                                                >
                                                    ✕ Declining Card (Fails)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="checkout-fields-stack">
                                            <div className="checkout-field">
                                                <label htmlFor="checkout-cardNumber">Card Number</label>
                                                <input
                                                    id="checkout-cardNumber"
                                                    type="text"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    placeholder="4000 1234 5678 9010"
                                                    required
                                                />
                                            </div>

                                            <div className="checkout-form-row-2">
                                                <div className="checkout-field">
                                                    <label htmlFor="checkout-cardExpiry">Expiry Date</label>
                                                    <input
                                                        id="checkout-cardExpiry"
                                                        type="text"
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(e.target.value)}
                                                        placeholder="MM/YY"
                                                        required
                                                    />
                                                </div>
                                                <div className="checkout-field">
                                                    <label htmlFor="checkout-cardCvv">Security Code (CVV)</label>
                                                    <input
                                                        id="checkout-cardCvv"
                                                        type="text"
                                                        value={cardCvv}
                                                        onChange={(e) => setCardCvv(e.target.value)}
                                                        placeholder="888"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <button
                                type="submit"
                                className="btn-gold checkout-submit-cta"
                                disabled={loading || !user?.isVerified}
                            >
                                <span>
                                    {loading
                                        ? "Authorizing Acquisition..."
                                        : `Confirm Acquisition — ${formatPrice(subtotal)}`}
                                </span>
                                {!loading && <IconArrow width={16} height={16} />}
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Sticky Acquisition Summary */}
                    <aside className="checkout-summary-column">
                        <div className="cart-summary-box checkout-summary-box">
                            <div className="cart-summary-head">
                                <span className="cart-summary-kicker">ORDER DOSSIER</span>
                                <h3>Acquisition Summary</h3>
                            </div>

                            <div className="checkout-items-list">
                                {cartItems.map((item) => (
                                    <div className="checkout-mini-item" key={item.product}>
                                        <img
                                            src={
                                                item.image ||
                                                "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=150&q=80"
                                            }
                                            alt={item.name}
                                            className="checkout-mini-thumb"
                                        />
                                        <div className="checkout-mini-info">
                                            {item.brand && (
                                                <span className="checkout-mini-brand">{item.brand}</span>
                                            )}
                                            <strong>{item.name}</strong>
                                            <span className="checkout-mini-meta">
                                                Qty {item.quantity} &bull; {formatPrice(item.price)}
                                            </span>
                                        </div>
                                        <span className="checkout-mini-price">
                                            {formatPrice(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <hr className="summary-divider" />

                            <div className="cart-summary-rows">
                                <div className="summary-row">
                                    <span>
                                        Subtotal ({totalUnits} {totalUnits === 1 ? "pc" : "pcs"})
                                    </span>
                                    <strong>{formatPrice(subtotal)}</strong>
                                </div>

                                <div className="summary-row">
                                    <span>Armored Transport</span>
                                    <span className="summary-complimentary">Complimentary</span>
                                </div>

                                <div className="summary-row">
                                    <span>Maison Certification</span>
                                    <span className="summary-complimentary">Included</span>
                                </div>
                            </div>

                            <hr className="summary-divider" />

                            <div className="summary-row summary-total">
                                <div>
                                    <span className="summary-total__label">Total Settlement</span>
                                    <small className="summary-total__tax">Escrow-protected transaction</small>
                                </div>
                                <strong className="summary-total__value">{formatPrice(subtotal)}</strong>
                            </div>

                            <div className="cart-trust-list">
                                <div className="cart-trust-item">
                                    <IconShield width={15} height={15} />
                                    <span>100% Provenance &amp; Escapement Verified</span>
                                </div>
                                <div className="cart-trust-item">
                                    <IconTruck width={15} height={15} />
                                    <span>Insured Door-to-Door Armored Courier</span>
                                </div>
                                <div className="cart-trust-item">
                                    <IconWatch width={15} height={15} />
                                    <span>2-Year Maison Mechanical Warranty</span>
                                </div>
                                <div className="cart-trust-item">
                                    <IconSparkle width={15} height={15} />
                                    <span>Instant Official PDF Invoice Upon Settlement</span>
                                </div>
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
