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
import { StatusBadge, AureoSelect } from "../../components/ui";
import AdminHeader from "../../components/layout/AdminHeader";
import {
    IconReceipt,
    IconTrendUp,
    IconTruck,
    IconSparkle
} from "../../components/layout/icons";

// FR 4.2: the order status flow. A completed order can never move back.
const ORDER_STATUS_FLOW = {
    Pending: ["Paid", "Cancelled"],
    Paid: ["Shipped"],
    Shipped: ["Completed"],
    Completed: [],
    Cancelled: []
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
                    <div style={{ width: "220px" }}>
                        <AureoSelect
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: "", label: "All statuses" },
                                ...Object.keys(ORDER_STATUS_FLOW).map((status) => ({
                                    value: status,
                                    label: status
                                }))
                            ]}
                        />
                    </div>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {mutationError && <div className="auth-error">{mutationError}</div>}

                {/* Metric Summary Cards */}
                <div className="vault-metrics-grid" style={{ marginBottom: "2rem" }}>
                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Total Acquisitions</span>
                            <div className="vault-metric-icon"><IconReceipt /></div>
                        </div>
                        <div className="vault-metric-val">{(orders || []).length}</div>
                        <span className="vault-metric-hint">All customer watch order placements</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Gross Revenue</span>
                            <div className="vault-metric-icon"><IconTrendUp /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "var(--gold)" }}>
                            {formatPrice(
                                (orders || [])
                                    .filter((o) => o.status !== "Cancelled")
                                    .reduce((sum, o) => sum + (o.totalPrice || calculateTotal(o)), 0)
                            )}
                        </div>
                        <span className="vault-metric-hint">Settled and active sales volume</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Pending Dispatch</span>
                            <div className="vault-metric-icon"><IconTruck /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "#fbbf24" }}>
                            {(orders || []).filter((o) => ["Pending", "Paid"].includes(o.status)).length}
                        </div>
                        <span className="vault-metric-hint">Orders awaiting processing or courier</span>
                    </article>

                    <article className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>Fulfilled Orders</span>
                            <div className="vault-metric-icon"><IconSparkle /></div>
                        </div>
                        <div className="vault-metric-val" style={{ color: "#4ade80" }}>
                            {(orders || []).filter((o) => ["Completed", "Shipped"].includes(o.status)).length}
                        </div>
                        <span className="vault-metric-hint">Dispatched or safely delivered</span>
                    </article>
                </div>

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
                                                <StatusBadge status={order.status} label={order.status} />
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
                                                        to={`/admin/orders/${order._id}`}
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
