import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
    getAdminOrders,
    updateAdminOrder,
    deleteAdminOrder
} from "../../redux/actions/orderActions";
import { confirmAction } from "../../utils/sweetAlert";
import AdminHeader from "../../components/layout/AdminHeader";

// FR 4.2: the order status flow. A completed order can never move back.
const ORDER_STATUS_FLOW = {
    Pending: ["Paid", "Cancelled"],
    Paid: ["Shipped"],
    Shipped: ["Completed"],
    Completed: [],
    Cancelled: []
};

const STATUS_CLASS = {
    Pending: "unverified-badge",
    Paid: "verified-badge",
    Shipped: "verified-badge",
    Completed: "verified-badge",
    Cancelled: "preowned-badge"
};

function AdminOrdersPage() {
    const dispatch = useDispatch();
    const { orders, loading, error } = useSelector((state) => state.adminOrders);
    const {
        loading: mutationLoading,
        isUpdated,
        isDeleted,
        error: mutationError
    } = useSelector((state) => state.adminOrderMutation);

    const [statusFilter, setStatusFilter] = useState("");

    useEffect(() => {
        dispatch(getAdminOrders());
    }, [dispatch]);

    useEffect(() => {
        if (isUpdated) {
            toast.success("Order status updated");
            dispatch(getAdminOrders());
        }
        if (isDeleted) {
            toast.success("Order removed");
            dispatch(getAdminOrders());
        }
    }, [isUpdated, isDeleted, dispatch]);

    const formatPrice = (price) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }).format(price || 0);

    const calculateTotal = (order) =>
        (order.orderItems || []).reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

    const handleStatusChange = async (order, status) => {
        const confirmed = await confirmAction({
            title: `Move this order to "${status}"?`,
            message: `Order #${order._id} will be updated and the customer is notified.`,
            confirmText: `Set ${status}`,
            danger: false
        });

        if (confirmed) {
            dispatch(updateAdminOrder(order._id, status));
        }
    };

    const handleDelete = async (order) => {
        const confirmed = await confirmAction({
            title: "Remove this order?",
            message: `Order #${order._id} will be cancelled and the reserved stock returned to the vault.`,
            confirmText: "Remove order"
        });

        if (confirmed) {
            dispatch(deleteAdminOrder(order._id));
        }
    };

    const visibleOrders = (orders || []).filter(
        (order) => !statusFilter || order.status === statusFilter
    );

    return (
        <main className="admin-page">
            <AdminHeader />

            <div className="admin-container">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">TRANSACTION CONTROL</p>
                        <h1>Orders &amp; Status Flow</h1>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="catalog-select"
                        style={{ maxWidth: "220px" }}
                    >
                        <option value="">All statuses</option>
                        {Object.keys(ORDER_STATUS_FLOW).map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {mutationError && <div className="auth-error">{mutationError}</div>}

                {loading && <p className="catalog-message">Loading orders...</p>}

                {!loading && visibleOrders.length === 0 && (
                    <div className="empty-state">
                        <p>No orders match this view.</p>
                        <span>Completed transactions and their PDF receipts appear here.</span>
                    </div>
                )}

                {visibleOrders.length > 0 && (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleOrders.map((order) => {
                                    const nextStatuses = ORDER_STATUS_FLOW[order.status] || [];

                                    return (
                                        <tr key={order._id}>
                                            <td>
                                                <strong>#{order._id?.slice(-8)}</strong>
                                                <span className="admin-subtext">
                                                    {new Date(order.createdAt).toLocaleDateString("en-PH")}
                                                </span>
                                            </td>
                                            <td>
                                                <strong>{order.user?.name || "Collector"}</strong>
                                                <span className="admin-subtext">{order.user?.email}</span>
                                            </td>
                                            <td>
                                                {(order.orderItems || []).map((item) => (
                                                    <span className="admin-subtext" key={item._id || item.name}>
                                                        {item.quantity} x {item.name}
                                                    </span>
                                                ))}
                                            </td>
                                            <td>
                                                <strong>{formatPrice(calculateTotal(order))}</strong>
                                            </td>
                                            <td>
                                                <span className="admin-subtext">{order.paymentMethod}</span>
                                                <span className="admin-subtext">{order.paymentStatus}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${STATUS_CLASS[order.status] || "unverified-badge"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="admin-action-cell">
                                                    {nextStatuses.map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            className="admin-btn edit-btn"
                                                            onClick={() => handleStatusChange(order, status)}
                                                            disabled={mutationLoading}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}

                                                    <Link
                                                        to={`/order/${order._id}`}
                                                        className="admin-btn edit-btn"
                                                    >
                                                        View
                                                    </Link>

                                                    {order.status !== "Completed" && (
                                                        <button
                                                            type="button"
                                                            className="admin-btn del-btn"
                                                            onClick={() => handleDelete(order)}
                                                            disabled={mutationLoading}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}

export default AdminOrdersPage;
