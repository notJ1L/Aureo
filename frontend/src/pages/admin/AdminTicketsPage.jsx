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

    const visible = (tickets || []).filter(
        (ticket) => !statusFilter || ticket.status === statusFilter
    );

    const totalCount = (tickets || []).length;
    const activeRepairsCount = (tickets || []).filter((t) => ["Received", "Diagnosing"].includes(t.status)).length;
    const awaitingPartsCount = (tickets || []).filter((t) => t.status === "Waiting for Parts").length;
    const completedCount = (tickets || []).filter((t) => t.status === "Completed").length;

    return (
        <main className="admin-page">
            <AdminHeader />

            <div className="admin-container">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">SUPPORT DESK</p>
                        <h1>Service Tickets</h1>
                    </div>
                    <div style={{ width: "240px" }}>
                        <AureoSelect
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: "", label: "All statuses" },
                                ...Object.keys(TICKET_STATUS_FLOW).map((status) => ({
                                    value: status,
                                    label: status
                                }))
                            ]}
                        />
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="vault-metrics-grid">
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
