import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getMyOrders, cancelOrder } from "../redux/actions/orderActions";
import { confirmAction } from "../utils/sweetAlert";

function OrdersPage() {
    const dispatch = useDispatch();
    const location = useLocation();

    const { orders, loading, error } = useSelector((state) => state.myOrders);
    const { isCancelled } = useSelector((state) => state.orderCancel);

    useEffect(() => {
        dispatch(getMyOrders());
    }, [dispatch, isCancelled]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const handleCancel = async (orderId) => {
        const confirmed = await confirmAction({
            title: "Cancel this acquisition?",
            message: "The timepiece returns to the Aureo vault. This cannot be undone.",
            confirmText: "Cancel order"
        });

        if (confirmed) {
            dispatch(cancelOrder(orderId));
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Paid":
            case "Completed":
                return "verified-badge";
            case "Pending":
                return "role-badge";
            case "Shipped":
                return "preowned-badge";
            case "Cancelled":
                return "sold-badge";
            default:
                return "role-badge";
        }
    };

    return (
        <main className="orders-page">
            <header className="navbar">
                <Link className="logo" to="/">AUREO</Link>

                <nav className="nav-links">
                    <Link to="/catalog">Collection</Link>
                    <Link to="/wishlist">Wishlist</Link>
                    <Link to="/orders" style={{ color: "var(--gold)" }}>Orders</Link>
                </nav>

                <div className="nav-actions">
                    <Link to="/me" className="nav-action">Account</Link>
                </div>
            </header>

            <div className="orders-container">
                <div className="orders-header">
                    <p className="eyebrow">ACQUISITION ARCHIVE</p>
                    <h1>My Watch Orders</h1>
                    <p className="auth-description">
                        Track the delivery status, payment receipts, and historical acquisitions of your horological timepieces.
                    </p>
                </div>

                {location.state?.newOrderPlaced && (
                    <div className="auth-info" style={{ marginBottom: "1.5rem" }}>
                        ✓ Acquisition confirmed! An archival confirmation receipt has been sent to your registered email.
                    </div>
                )}

                {loading && <p className="loading-state">Loading your acquisitions...</p>}
                {error && <div className="auth-error">{error}</div>}

                {!loading && orders.length === 0 && !error && (
                    <div className="empty-state">
                        <p>You have not placed any orders yet.</p>
                        <span>Start your collection by exploring certified timepieces in our catalog.</span>
                        <Link to="/catalog" className="gold-button" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                            Explore Collection
                        </Link>
                    </div>
                )}

                <div className="orders-list">
                    {orders.map((ord) => {
                        const total = ord.orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

                        return (
                            <article className="order-card" key={ord._id}>
                                <div className="order-card-head">
                                    <div>
                                        <span className="order-id-label">ORDER #{ord._id}</span>
                                        <span className="order-date-label">
                                            Placed on {new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                    </div>
                                    <div className="order-head-badges">
                                        <span className={`badge ${getStatusClass(ord.status)}`}>
                                            {ord.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="order-card-items">
                                    {ord.orderItems.map((item, idx) => (
                                        <div className="order-item-row" key={idx}>
                                            <img
                                                src={item.image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=100&q=80"}
                                                alt={item.name}
                                                className="order-item-thumb"
                                            />
                                            <div className="order-item-info">
                                                <h4>
                                                    <Link to={`/product/${item.product}`}>{item.name}</Link>
                                                </h4>
                                                <span>Qty: {item.quantity} &bull; {formatPrice(item.price)} each</span>
                                            </div>
                                            <strong className="order-item-price">
                                                {formatPrice(item.price * item.quantity)}
                                            </strong>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-card-footer">
                                    <div className="order-footer-details">
                                        <span>Payment Method: <strong>{ord.paymentMethod}</strong> ({ord.paymentStatus})</span>
                                        <span className="order-total-highlight">Total: <strong>{formatPrice(total)}</strong></span>
                                    </div>

                                    <div className="order-card-actions">
                                        {ord.status === "Pending" && (
                                            <button
                                                type="button"
                                                className="outline-button cancel-order-btn"
                                                onClick={() => handleCancel(ord._id)}
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                        <Link to={`/order/${ord._id}`} className="gold-button">
                                            View Receipt & Timeline
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}

export default OrdersPage;
