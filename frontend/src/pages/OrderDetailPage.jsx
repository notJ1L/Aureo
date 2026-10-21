import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getOrderDetails, cancelOrder } from "../redux/actions/orderActions";
import { confirmAction } from "../utils/sweetAlert";

function OrderDetailPage() {
    const { id } = useParams();
    const dispatch = useDispatch();

    const { order, loading, error } = useSelector((state) => state.orderDetails);
    const { isCancelled } = useSelector((state) => state.orderCancel);

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
            confirmText: "Cancel order"
        });

        if (confirmed) {
            dispatch(cancelOrder(id));
        }
    };

    if (loading) {
        return (
            <main className="detail-page-loading">
                <p>Retrieving order archival record #{id}...</p>
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="detail-page-error">
                <h2>Record Not Found</h2>
                <p>{error || "Unable to locate this order."}</p>
                <Link to="/orders" className="gold-button">Back to My Orders</Link>
            </main>
        );
    }

    const total = order.orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

    return (
        <main className="order-detail-page">
            <header className="navbar">
                <Link className="logo" to="/">AUREO</Link>

                <nav className="nav-links">
                    <Link to="/catalog">Collection</Link>
                    <Link to="/orders" style={{ color: "var(--gold)" }}>My Orders</Link>
                </nav>

                <div className="nav-actions">
                    <Link to="/me" className="nav-action">Account</Link>
                </div>
            </header>

            <div className="order-detail-container">
                <div className="order-detail-head-bar">
                    <div>
                        <Link to="/orders" className="back-link">← Back to all orders</Link>
                        <h1>Order #{order._id}</h1>
                        <p className="order-timestamp">
                            Acquisition initiated on {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>

                    <div className="head-right-actions">
                        <span className="badge role-badge">{order.status.toUpperCase()}</span>
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
                                            <Link to={`/product/${item.product}`} className="review-product-link">
                                                ★ View Timepiece / Leave Review
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
                        <section className="checkout-section-box">
                            <h3>Order Tracking & Provenance Timeline</h3>
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

                            <div className="summary-row summary-total">
                                <span>Grand Total</span>
                                <strong style={{ color: "var(--gold)" }}>{formatPrice(total)}</strong>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default OrderDetailPage;
