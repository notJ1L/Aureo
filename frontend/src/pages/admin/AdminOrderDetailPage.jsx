import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getOrderDetails } from "../../redux/actions/orderActions";
import { StatusBadge } from "../../components/ui";
import api from "../../services/api";
import AdminHeader from "../../components/layout/AdminHeader";
import "../../styles/admin.css";

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

function AdminOrderDetailPage() {
    const { id } = useParams();
    const dispatch = useDispatch();

    const { order, loading, error } = useSelector((state) => state.orderDetails);

    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        dispatch(getOrderDetails(id));
    }, [dispatch, id]);

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
            <main className="admin-page">
                <AdminHeader />
                <div className="order-detail-container" style={{ padding: "4rem 0" }}>
                    <div style={{ height: "400px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", animation: "aureoPulseGold 2s infinite" }} />
                </div>
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="admin-page">
                <AdminHeader />
                <div className="order-detail-container">
                    <div className="detail-page-error" style={{ textAlign: "center", background: "var(--bg-card)", padding: "2.5rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <h2>Record Not Found</h2>
                        <p style={{ color: "var(--text-secondary)", margin: "1rem 0 1.5rem" }}>{error || "Unable to locate this order."}</p>
                        <Link to="/admin/orders" className="gold-button">Back to All Orders</Link>
                    </div>
                </div>
            </main>
        );
    }

    const total = order.orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const isCompletedOrPaid = order.status === "Completed" || order.status === "Paid";

    return (
        <main className="admin-page">
            <AdminHeader />

            <div className="order-detail-container">
                <div className="order-detail-head-bar">
                    <div>
                        <Link to="/admin/orders" className="back-link" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
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
                    </div>
                </div>

                <div className="order-detail-grid">
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
                                            <Link to={`/product/${item.product}`} className="review-product-link">
                                                View timepiece
                                            </Link>
                                        </div>
                                        <strong className="order-detail-item-total">
                                            {formatPrice(item.price * item.quantity)}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </section>

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

                    <aside className="order-detail-sidebar">
                        <div className="checkout-section-box">
                            <h3>Customer</h3>
                            <p className="sidebar-text">
                                <strong>{order.user?.name || "Collector"}</strong><br />
                                {order.user?.email}<br />
                                {order.user?.contactNumber}
                            </p>

                            <hr className="profile-divider" />

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
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default AdminOrderDetailPage;
