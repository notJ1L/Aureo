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
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

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

    const allOrders = orders || [];
    const counts = {
        all: allOrders.length,
        Pending: allOrders.filter((o) => o.status === "Pending").length,
        Paid: allOrders.filter((o) => o.status === "Paid").length,
        Shipped: allOrders.filter((o) => o.status === "Shipped").length,
        Completed: allOrders.filter((o) => o.status === "Completed").length,
        Cancelled: allOrders.filter((o) => o.status === "Cancelled").length
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder(field === "customer" ? "asc" : "desc");
        }
    };

    const visibleOrders = allOrders
        .filter((order) => {
            if (statusFilter && order.status !== statusFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesId = (order._id || "").toLowerCase().includes(q);
                const matchesUser = (order.user?.name || "").toLowerCase().includes(q);
                const matchesEmail = (order.user?.email || "").toLowerCase().includes(q);
                return matchesId || matchesUser || matchesEmail;
            }
            return true;
        })
        .sort((a, b) => {
            let comp = 0;
            if (sortField === "customer") {
                comp = (a.user?.name || "").localeCompare(b.user?.name || "");
            } else if (sortField === "total") {
                const totalA = a.totalPrice || calculateTotal(a);
                const totalB = b.totalPrice || calculateTotal(b);
                comp = totalA - totalB;
            } else {
                comp = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            }
            return sortOrder === "asc" ? comp : -comp;
        });

    return (
        <main className="admin-page">
            <AdminHeader />

            <div className="admin-container">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">TRANSACTION CONTROL</p>
                        <h1>Orders &amp; Status Flow</h1>
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

                {/* Filter and Search Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                    <div className="admin-status-tabs">
                        <button
                            type="button"
                            className={`admin-tab-btn ${statusFilter === "" ? "is-active" : ""}`}
                            onClick={() => setStatusFilter("")}
                        >
                            All Orders <span className="admin-tab-count">{counts.all}</span>
                        </button>
                        {Object.keys(ORDER_STATUS_FLOW).map((st) => (
                            <button
                                key={st}
                                type="button"
                                className={`admin-tab-btn ${statusFilter === st ? "is-active" : ""}`}
                                onClick={() => setStatusFilter(st)}
                            >
                                {st} <span className="admin-tab-count">{counts[st] || 0}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
                        <select
                            className="admin-filter-select"
                            value={`${sortField}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split("-");
                                setSortField(field);
                                setSortOrder(order);
                            }}
                            aria-label="Sort orders"
                        >
                            <option value="createdAt-desc">Date: Newest First</option>
                            <option value="createdAt-asc">Date: Oldest First</option>
                            <option value="total-desc">Total: High to Low</option>
                            <option value="total-asc">Total: Low to High</option>
                            <option value="customer-asc">Customer: A to Z</option>
                            <option value="customer-desc">Customer: Z to A</option>
                        </select>

                        <input
                            type="text"
                            className="catalog-input"
                            placeholder="Search order #, customer, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ minWidth: "220px", padding: "0.45rem 0.8rem", fontSize: "0.82rem" }}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="outline-button"
                                onClick={() => setSearchQuery("")}
                                style={{ padding: "0.45rem 0.75rem", fontSize: "0.78rem" }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
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
                                    <th
                                        className={`sortable-th ${sortField === "createdAt" ? "is-sorted" : ""}`}
                                        onClick={() => handleSort("createdAt")}
                                        title="Click to sort by Date"
                                    >
                                        Order
                                        <span className="sort-icon">{sortField === "createdAt" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                    </th>
                                    <th
                                        className={`sortable-th ${sortField === "customer" ? "is-sorted" : ""}`}
                                        onClick={() => handleSort("customer")}
                                        title="Click to sort by Customer Name"
                                    >
                                        Customer
                                        <span className="sort-icon">{sortField === "customer" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                    </th>
                                    <th>Items</th>
                                    <th
                                        className={`sortable-th ${sortField === "total" ? "is-sorted" : ""}`}
                                        onClick={() => handleSort("total")}
                                        title="Click to sort by Total Amount"
                                    >
                                        Total
                                        <span className="sort-icon">{sortField === "total" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}</span>
                                    </th>
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
