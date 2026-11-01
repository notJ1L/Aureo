import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
    getAdminTickets,
    updateTicketStatus
} from "../../redux/actions/serviceActions";
import { ADMIN_TICKET_STATUS_RESET } from "../../redux/constants/serviceConstants";
import { confirmAction } from "../../utils/sweetAlert";
import AdminHeader from "../../components/layout/AdminHeader";
import { AureoSelect } from "../../components/ui";
import {
    IconChat,
    IconTool,
    IconSparkle,
    IconShield
} from "../../components/layout/icons";

// FR 5.3: the ticket state tracking.
const TICKET_STATUS_FLOW = {
    Received: ["Diagnosing", "Waiting for Parts", "Completed"],
    Diagnosing: ["Waiting for Parts", "Completed"],
    "Waiting for Parts": ["Diagnosing", "Completed"],
    Completed: []
};

const STATUS_CLASS = {
    Received: "unverified-badge",
    Diagnosing: "preowned-badge",
    "Waiting for Parts": "preowned-badge",
    Completed: "verified-badge"
};

function AdminTicketsPage() {
    const dispatch = useDispatch();
    const { tickets, loading, error } = useSelector((state) => state.ticketList);
    const {
        loading: mutationLoading,
        isUpdated,
        error: mutationError
    } = useSelector((state) => state.adminTicketStatus);

    const [statusFilter, setStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    useEffect(() => {
        dispatch(getAdminTickets());
    }, [dispatch]);

    useEffect(() => {
        if (isUpdated) {
            toast.success("Ticket status updated");
            dispatch({ type: ADMIN_TICKET_STATUS_RESET });
            dispatch(getAdminTickets());
        }
    }, [isUpdated, dispatch]);

    const handleStatusChange = async (ticket, status) => {
        const confirmed = await confirmAction({
            title: `Move this ticket to "${status}"?`,
            message: `Ticket ${ticket.ticketNumber} will be updated and the collector notified.`,
            confirmText: `Set ${status}`,
            danger: false
        });

        if (confirmed) {
            dispatch(updateTicketStatus(ticket._id, status));
        }
    };

    const allTickets = tickets || [];
    const counts = {
        all: allTickets.length,
        Received: allTickets.filter((t) => t.status === "Received").length,
        Diagnosing: allTickets.filter((t) => t.status === "Diagnosing").length,
        "Waiting for Parts": allTickets.filter((t) => t.status === "Waiting for Parts").length,
        Completed: allTickets.filter((t) => t.status === "Completed").length
    };

    const totalCount = allTickets.length;
    const activeRepairsCount = allTickets.filter((t) => ["Received", "Diagnosing"].includes(t.status)).length;
    const awaitingPartsCount = allTickets.filter((t) => t.status === "Waiting for Parts").length;
    const completedCount = allTickets.filter((t) => t.status === "Completed").length;

    const visible = allTickets
        .filter((ticket) => {
            if (statusFilter && ticket.status !== statusFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesNum = (ticket.ticketNumber || "").toLowerCase().includes(q);
                const matchesUser = (ticket.user?.name || "").toLowerCase().includes(q);
                const matchesEmail = (ticket.user?.email || "").toLowerCase().includes(q);
                const matchesIssue = (ticket.issueDescription || "").toLowerCase().includes(q);
                return matchesNum || matchesUser || matchesEmail || matchesIssue;
            }
            return true;
        })
        .sort((a, b) => {
            let comp = 0;
            if (sortField === "ticket") {
                comp = (a.ticketNumber || "").localeCompare(b.ticketNumber || "");
            } else if (sortField === "user") {
                comp = (a.user?.name || "").localeCompare(b.user?.name || "");
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
                        <p className="eyebrow">SUPPORT DESK</p>
                        <h1>Service Tickets</h1>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="vault-metrics-grid" style={{ marginBottom: "2rem" }}>
                    <div className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>TOTAL TICKETS</span>
                            <div className="vault-metric-icon">
                                <IconChat size={20} />
                            </div>
                        </div>
                        <div className="vault-metric-val">{totalCount}</div>
                        <div className="vault-metric-hint">Client repair & service cases</div>
                    </div>

                    <div className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>IN DIAGNOSTIC</span>
                            <div className="vault-metric-icon" style={{ color: "#fbbf24" }}>
                                <IconTool size={20} />
                            </div>
                        </div>
                        <div className="vault-metric-val">{activeRepairsCount}</div>
                        <div className="vault-metric-hint">Received & bench inspection</div>
                    </div>

                    <div className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>AWAITING PARTS</span>
                            <div className="vault-metric-icon" style={{ color: "#f87171" }}>
                                <IconShield size={20} />
                            </div>
                        </div>
                        <div className="vault-metric-val">{awaitingPartsCount}</div>
                        <div className="vault-metric-hint">Pending movement & parts</div>
                    </div>

                    <div className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>COMPLETED</span>
                            <div className="vault-metric-icon" style={{ color: "#4ade80" }}>
                                <IconSparkle size={20} />
                            </div>
                        </div>
                        <div className="vault-metric-val">{completedCount}</div>
                        <div className="vault-metric-hint">Restored & ready for return</div>
                    </div>
                </div>

                {/* Status Tabs & Filter/Search Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                    <div className="admin-status-tabs" style={{ marginBottom: 0 }}>
                        <button
                            type="button"
                            className={`admin-tab-btn ${statusFilter === "" ? "is-active" : ""}`}
                            onClick={() => setStatusFilter("")}
                        >
                            All Tickets <span className="admin-tab-count">{counts.all}</span>
                        </button>
                        {Object.keys(TICKET_STATUS_FLOW).map((st) => (
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
                            aria-label="Sort tickets"
                        >
                            <option value="createdAt-desc">Newest First</option>
                            <option value="createdAt-asc">Oldest First</option>
                            <option value="ticket-asc">Ticket #: A to Z</option>
                            <option value="ticket-desc">Ticket #: Z to A</option>
                            <option value="user-asc">Collector: A to Z</option>
                        </select>

                        <input
                            type="text"
                            className="catalog-input"
                            placeholder="Search ticket #, collector, email..."
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

                {error && <div className="auth-error">{error}</div>}
                {mutationError && <div className="auth-error">{mutationError}</div>}

                {loading && <p className="catalog-message">Loading tickets...</p>}

                {!loading && visible.length === 0 && (
                    <div className="empty-state">
                        <p>No tickets match this view.</p>
                        <span>Support requests from collectors appear here.</span>
                    </div>
                )}

                <div className="ticket-list">
                    {visible.map((ticket) => {
                        const nextStatuses = TICKET_STATUS_FLOW[ticket.status] || [];

                        return (
                            <article className="ticket-card" key={ticket._id}>
                                <div className="ticket-head">
                                    <div>
                                        <strong>{ticket.ticketNumber}</strong>
                                        <p className="appraisal-meta">
                                            {ticket.user?.name} ({ticket.user?.email})
                                        </p>
                                    </div>
                                    <span className={`badge ${STATUS_CLASS[ticket.status] || "unverified-badge"}`}>
                                        {ticket.status}
                                    </span>
                                </div>

                                <p className="appraisal-meta">
                                    {ticket.service?.name} &bull; {ticket.watchBrand} {ticket.watchModel}
                                </p>
                                <p className="appraisal-meta">{ticket.problemDescription}</p>

                                <ol className="ticket-timeline">
                                    {(ticket.statusHistory || []).map((entry, index) => (
                                        <li key={`${entry.status}-${index}`}>
                                            <span className="timeline-dot" />
                                            <div>
                                                <strong>{entry.status}</strong>
                                                <span>
                                                    {new Date(entry.changedAt).toLocaleString("en-PH")}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ol>

                                {nextStatuses.length > 0 && (
                                    <div className="appraisal-actions">
                                        {nextStatuses.map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                className="admin-btn edit-btn"
                                                onClick={() => handleStatusChange(ticket, status)}
                                                disabled={mutationLoading}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}

export default AdminTicketsPage;
