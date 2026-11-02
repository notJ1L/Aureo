import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getOrderDetails, cancelOrder } from "../redux/actions/orderActions";
import { confirmAction } from "../utils/sweetAlert";
import { StatusBadge } from "../components/ui";
import api from "../services/api";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";

function OrderDetailPage() {
    const { id } = useParams();
    const dispatch = useDispatch();

    const { order, loading, error } = useSelector((state) => state.orderDetails);
    const { isCancelled } = useSelector((state) => state.orderCancel);

    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        dispatch(getOrderDetails(id));
    }, [dispatch, id, isCancelled]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const handleCancel = async () => {
        const confirmed = await confirmAction({
            title: "Cancel this order?",
            message: "The timepiece returns to the Aureo inventory. This cannot be undone.",
            confirmText: "Cancel order",
            danger: true
        });

        if (confirmed) {
            dispatch(cancelOrder(id));
        }
    };

    const handleDownloadReceipt = async () => {
        setDownloadingPdf(true);
        try {
            const response = await api.get(`/order/${id}/receipt`, {
                responseType: "blob"
            });
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `aureo-receipt-${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Receipt downloaded.");
        } catch (err) {
            console.error("Receipt error", err);
            toast.error(err.response?.data?.message || "Could not generate PDF receipt.");
        } finally {
            setDownloadingPdf(false);
        }
    };

    if (loading) {
        return (
            <main className="order-detail-page page-enter">
                <SiteHeader variant="solid" />
                <div className="order-detail-container" style={{ padding: "4rem 0" }}>
                    <div style={{ height: "400px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", animation: "aureoPulseGold 2s infinite" }} />
                </div>
                <SiteFooter />
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="order-detail-page page-enter">
                <SiteHeader variant="solid" />
                <div className="order-detail-container" style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
                    <div className="detail-page-error" style={{ textAlign: "center", background: "var(--bg-card)", padding: "2.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <h2>Record Not Found</h2>
                        <p style={{ color: "var(--text-secondary)", margin: "1rem 0 1.5rem" }}>{error || "Unable to locate this order."}</p>
                        <Link to="/orders" className="gold-button">Back to My Orders</Link>
                    </div>
                </div>
                <SiteFooter />
            </main>
        );
    }

    const total = order.orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const isCompletedOrPaid = order.status === "Completed" || order.status === "Paid";

    return (
        <main className="order-detail-page page-enter">
            <SiteHeader variant="solid" />

            <div className="order-detail-container">
                <div className="order-detail-head-bar">
                    <div>
                        <Link to="/orders" className="back-link" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            ← Back to all orders
                        </Link>
                        <h1 style={{ marginTop: "0.5rem" }}>Order #{order._id}</h1>
                        <p className="order-timestamp">
                            Acquisition initiated on {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>

                    <div className="head-right-actions" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                        <StatusBadge status={order.status} label={order.status} />

                        {isCompletedOrPaid && (
                            <button
                                type="button"
                                className="gold-button"
                                onClick={handleDownloadReceipt}
                                disabled={downloadingPdf}
                                style={{ minHeight: "40px", padding: "0 1rem", fontSize: "0.8rem" }}
                            >
                                {downloadingPdf ? "Generating PDF..." : "📄 Download PDF Receipt"}
                            </button>
                        )}

                        {order.status === "Pending" && (
                            <button type="button" className="outline-button" onClick={handleCancel}>
                                Cancel Order
                            </button>
                        )}
                    </div>
                </div>

                <div className="order-detail-grid">
                    {/* Items & Review Links */}
                    <div className="order-detail-main">
                        <section className="checkout-section-box">
                            <h3>Acquired Timepieces</h3>
                            <div className="order-items-table">
                                {order.orderItems.map((item, idx) => (
                                    <div className="order-detail-item-row" key={idx}>
                                        <img src={item.image} alt={item.name} className="order-item-thumb-lg" />
                                        <div className="order-detail-item-info">
                                            <h4>{item.name}</h4>
                                            <p className="item-price-qty">{formatPrice(item.price)} × {item.quantity}</p>
                                            <Link to={`/product/${item.product}`} className="review-product-link" style={{ color: "var(--gold)" }}>
                                                {order.status === "Completed" ? "★ View Timepiece / Leave Review" : "View Timepiece"}
                                            </Link>
                                        </div>
                                        <strong className="order-detail-item-total">
                                            {formatPrice(item.price * item.quantity)}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Status History Timeline */}
                        <section className="checkout-section-box" style={{ marginTop: "1.5rem" }}>
                            <h3>Order Tracking &amp; Provenance Timeline</h3>
                            <div className="timeline-container">
                                {order.statusHistory?.map((hist, idx) => (
                                    <div className="timeline-step" key={idx}>
                                        <div className="timeline-dot" />
                                        <div className="timeline-content">
                                            <strong>Status: {hist.status}</strong>
                                            <span>{new Date(hist.changedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Shipping & Payment Meta */}
                    <aside className="order-detail-sidebar">
                        <div className="checkout-section-box">
                            <h3>Shipping Destination</h3>
                            <p className="sidebar-text">
                                {order.shippingInfo?.address}<br />
                                {order.shippingInfo?.city}, {order.shippingInfo?.postalCode}<br />
                                {order.shippingInfo?.country}<br />
                                <strong>Contact:</strong> {order.shippingInfo?.phone}
                            </p>

                            <hr className="profile-divider" />

                            <h3>Payment Details</h3>
                            <p className="sidebar-text">
                                <strong>Method:</strong> {order.paymentMethod}<br />
                                <strong>Status:</strong> {order.paymentStatus}
                            </p>

                            <hr className="profile-divider" />

                            <div className="summary-row summary-total" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>Grand Total</span>
                                <strong style={{ color: "var(--gold)", fontSize: "1.2rem" }}>{formatPrice(total)}</strong>
                            </div>

                            {isCompletedOrPaid && (
                                <button
                                    type="button"
                                    className="outline-button"
                                    onClick={handleDownloadReceipt}
                                    disabled={downloadingPdf}
                                    style={{ width: "100%", marginTop: "1.2rem" }}
                                >
                                    {downloadingPdf ? "Generating..." : "Download Official PDF Invoice"}
                                </button>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}

export default OrderDetailPage;
