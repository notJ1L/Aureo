import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/ui";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import api from "../services/api";

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

function OrderSuccessPage() {
    const { id } = useParams();
    const [currentOrder, setCurrentOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, []);

    useEffect(() => {
        let isCurrent = true;

        const fetchOrder = async () => {
            setLoading(true);
            setError("");
            setCurrentOrder(null);

            try {
                const { data } = await api.get(`/order/${id}`);
                if (isCurrent) {
                    setCurrentOrder(data.order);
                }
            } catch (requestError) {
                if (isCurrent) {
                    setError(requestError.response?.data?.message || "We could not retrieve this order right now.");
                }
            } finally {
                if (isCurrent) {
                    setLoading(false);
                }
            }
        };

        fetchOrder();

        return () => {
            isCurrent = false;
        };
    }, [id]);

    const subtotal = currentOrder?.orderItems?.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return (
        <main className="order-success-page" style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
            <style>{`
                @keyframes orderSuccessSealIn {
                    from { opacity: 0; transform: scale(0.7); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes orderSuccessCheckIn {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes orderSuccessCardIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            <SiteHeader variant="solid" />

            <div
                style={{
                    width: "min(900px, calc(100% - 32px))",
                    margin: "0 auto",
                    padding: "clamp(3rem, 8vw, 6rem) 0",
                    animation: "aureoFadeIn 500ms ease forwards"
                }}
            >
                <section style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <div
                        aria-hidden="true"
                        style={{
                            width: "76px",
                            height: "76px",
                            margin: "0 auto 1.5rem",
                            display: "grid",
                            placeItems: "center",
                            border: "1px solid var(--gold)",
                            borderRadius: "50%",
                            color: "var(--gold)",
                            animation: "orderSuccessSealIn 500ms ease forwards"
                        }}
                    >
                        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                            <circle cx="21" cy="21" r="18" stroke="currentColor" strokeWidth="1.5" />
                            <path
                                d="m12 21 6 6 12-13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                pathLength="1"
                                style={{
                                    strokeDasharray: 1,
                                    strokeDashoffset: 1,
                                    animation: "orderSuccessCheckIn 500ms ease 250ms forwards"
                                }}
                            />
                        </svg>
                    </div>
                    <p className="eyebrow" style={{ color: "var(--gold)" }}>ORDER CONFIRMED</p>
                    <h1 style={{ margin: "0.5rem 0 0.8rem", fontFamily: "var(--font-display)" }}>
                        Your timepiece is reserved.
                    </h1>
                    <p
                        style={{
                            maxWidth: "580px",
                            margin: "0 auto",
                            color: "var(--text-secondary)",
                            lineHeight: 1.7
                        }}
                    >
                        Your order has been received and is being prepared. You will receive a confirmation email shortly.
                    </p>
                </section>

                {loading && (
                    <div
                        style={{
                            minHeight: "260px",
                            display: "grid",
                            placeItems: "center",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: "12px",
                            color: "var(--text-secondary)"
                        }}
                    >
                        Retrieving your order details...
                    </div>
                )}

                {!loading && (error || !currentOrder) && (
                    <div
                        style={{
                            padding: "2rem",
                            textAlign: "center",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: "12px"
                        }}
                    >
                        <h2>Order confirmation unavailable</h2>
                        <p style={{ color: "var(--text-secondary)", margin: "1rem 0 1.5rem" }}>
                            {error || "We could not retrieve this order right now."}
                        </p>
                        <Link to="/catalog" className="gold-button">Continue Shopping</Link>
                    </div>
                )}

                {!loading && currentOrder && (
                    <section
                        style={{
                            padding: "clamp(1.25rem, 4vw, 2.25rem)",
                            background: "var(--bg-card)",
                            border: "1px solid var(--gold)",
                            borderRadius: "12px",
                            animation: "orderSuccessCardIn 500ms ease 200ms both"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                            <div>
                                <p className="eyebrow" style={{ marginBottom: "0.35rem" }}>ORDER REFERENCE</p>
                                <h2 style={{ margin: 0, fontFamily: "monospace", color: "var(--gold)" }}>
                                    Order #{currentOrder._id}
                                </h2>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <StatusBadge status={currentOrder.status} label={currentOrder.status} />
                                <StatusBadge status={currentOrder.paymentStatus} label={`Payment: ${currentOrder.paymentStatus}`} />
                            </div>
                        </div>

                        <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                            {currentOrder.orderItems.map((item, index) => (
                                <div
                                    key={`${item.product}-${index}`}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                        padding: "1rem 0",
                                        borderBottom: index === currentOrder.orderItems.length - 1 ? 0 : "1px solid var(--border)"
                                    }}
                                >
                                    <div>
                                        <strong>{item.name}</strong>
                                        <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                                            Qty {item.quantity}
                                        </span>
                                    </div>
                                    <span style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                        {formatPrice(item.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "grid", gap: "0.65rem", marginTop: "1.25rem", color: "var(--text-secondary)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Subtotal</span>
                                <strong>{formatPrice(subtotal)}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--gold)", fontSize: "1.15rem" }}>
                                <span>Grand Total</span>
                                <strong>{formatPrice(currentOrder.totalPrice ?? subtotal)}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem", paddingTop: "0.8rem", borderTop: "1px solid var(--border)", fontSize: "0.9rem" }}>
                                <span>Payment method</span>
                                <span>{currentOrder.paymentMethod}</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                            <Link to={`/order/${currentOrder._id}`} className="gold-button" style={{ flex: 1, textAlign: "center" }}>
                                View Order Details
                            </Link>
                            <Link to="/catalog" className="outline-button" style={{ flex: 1, textAlign: "center" }}>
                                Continue Shopping
                            </Link>
                        </div>
                    </section>
                )}
            </div>

            <SiteFooter />
        </main>
    );
}

export default OrderSuccessPage;
