import { useEffect, useState } from "react";
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

const TICKET_STAGES = ["Received", "Diagnosing", "Waiting for Parts", "Completed"];

const STATUS_CLASS = {
    Received: "unverified-badge",
    Diagnosing: "preowned-badge",
    "Waiting for Parts": "preowned-badge",
    Completed: "verified-badge"
};

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

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

    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

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
    const selectedTicket = selectedTicketId
        ? allTickets.find((t) => t._id === selectedTicketId) || null
        : null;

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
                const matchesIssue = (ticket.problemDescription || ticket.issueDescription || "").toLowerCase().includes(q);
                const matchesBrand = (ticket.watchBrand || "").toLowerCase().includes(q);
                const matchesModel = (ticket.watchModel || "").toLowerCase().includes(q);
                const matchesService = (ticket.service?.name || "").toLowerCase().includes(q);
                return (
                    matchesNum ||
                    matchesUser ||
                    matchesEmail ||
                    matchesIssue ||
                    matchesBrand ||
                    matchesModel ||
                    matchesService
                );
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

    const getStageState = (ticket, stageName) => {
        const historyStatuses = (ticket.statusHistory || []).map((h) => h.status);
        const currentIdx = TICKET_STAGES.indexOf(ticket.status);
        const stageIdx = TICKET_STAGES.indexOf(stageName);

        if (ticket.status === "Completed" && stageName === "Completed") {
            return "is-completed-final";
        }
        if (ticket.status === stageName) {
            return "is-active";
        }
        if (historyStatuses.includes(stageName) || stageIdx < currentIdx) {
            return "is-done";
        }
        return "";
    };

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
                        <div className="vault-metric-hint">Client repair &amp; service cases</div>
                    </div>

                    <div className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>IN DIAGNOSTIC</span>
                            <div className="vault-metric-icon" style={{ color: "#fbbf24" }}>
                                <IconTool size={20} />
                            </div>
                        </div>
                        <div className="vault-metric-val">{activeRepairsCount}</div>
                        <div className="vault-metric-hint">Received &amp; bench inspection</div>
                    </div>

                    <div className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>AWAITING PARTS</span>
                            <div className="vault-metric-icon" style={{ color: "#f87171" }}>
                                <IconShield size={20} />
                            </div>
                        </div>
                        <div className="vault-metric-val">{awaitingPartsCount}</div>
                        <div className="vault-metric-hint">Pending movement &amp; parts</div>
                    </div>

                    <div className="vault-metric-card">
                        <div className="vault-metric-head">
                            <span>COMPLETED</span>
                            <div className="vault-metric-icon" style={{ color: "#4ade80" }}>
                                <IconSparkle size={20} />
                            </div>
                        </div>
                        <div className="vault-metric-val">{completedCount}</div>
                        <div className="vault-metric-hint">Restored &amp; ready for return</div>
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
                        <div style={{ width: "190px" }}>
                            <AureoSelect
                                aria-label="Sort tickets"
                                value={`${sortField}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split("-");
                                    setSortField(field);
                                    setSortOrder(order);
                                }}
                                options={[
                                    { value: "createdAt-desc", label: "Newest First" },
                                    { value: "createdAt-asc", label: "Oldest First" },
                                    { value: "ticket-asc", label: "Ticket #: A to Z" },
                                    { value: "ticket-desc", label: "Ticket #: Z to A" },
                                    { value: "user-asc", label: "Collector: A to Z" }
                                ]}
                            />
                        </div>

                        <input
                            type="text"
                            className="catalog-input"
                            placeholder="Search ticket #, collector, watch..."
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
                        const photoCount = ticket.photos?.length || 0;
                        const displayCount = Math.min(photoCount, 3);

                        return (
                            <article className="ticket-card ticket-card--expandable" key={ticket._id}>
                                {photoCount > 0 && (
                                    <div
                                        className={`appraisal-photos appraisal-photos--${displayCount}`}
                                        onClick={() => {
                                            setSelectedTicketId(ticket._id);
                                            setActivePhotoIndex(0);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        title="Click to expand photos and ticket progress"
                                    >
                                        {(ticket.photos || []).slice(0, 3).map((photo, idx) => {
                                            const isLastAndMore = idx === 2 && photoCount > 3;
                                            return (
                                                <div key={photo.public_id || photo.url || idx} className="appraisal-photo-item">
                                                    <img src={photo.url} alt={`${ticket.watchBrand} ${ticket.watchModel}`} />
                                                    {isLastAndMore && (
                                                        <div className="appraisal-photo-more">
                                                            +{photoCount - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div className="appraisal-photo-overlay-hint">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="15 3 21 3 21 9" />
                                                <polyline points="9 21 3 21 3 15" />
                                                <line x1="21" y1="3" x2="14" y2="10" />
                                                <line x1="3" y1="21" x2="10" y2="14" />
                                            </svg>
                                            <span>Expand</span>
                                        </div>
                                    </div>
                                )}

                                <div className="ticket-card-body">
                                    <div className="ticket-head">
                                        <div>
                                            <strong>{ticket.ticketNumber}</strong>
                                            <p className="appraisal-meta">
                                                {ticket.user?.name} ({ticket.user?.email})
                                            </p>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <button
                                                type="button"
                                                className="appraisal-expand-btn"
                                                onClick={() => {
                                                    setSelectedTicketId(ticket._id);
                                                    setActivePhotoIndex(0);
                                                }}
                                                title="Expand ticket progress and inspection details"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <polyline points="9 21 3 21 3 15" />
                                                    <line x1="21" y1="3" x2="14" y2="10" />
                                                    <line x1="3" y1="21" x2="10" y2="14" />
                                                </svg>
                                                <span>Expand</span>
                                            </button>
                                            <span className={`badge ${STATUS_CLASS[ticket.status] || "unverified-badge"}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="appraisal-meta">
                                        {ticket.service?.name} &bull; {ticket.watchBrand} {ticket.watchModel}
                                    </p>
                                    <p className="appraisal-meta">{ticket.problemDescription}</p>

                                    {/* Mini 4-Stage Visual Progress Bar */}
                                    <div className="ticket-mini-progress" aria-label="Ticket progress">
                                        {TICKET_STAGES.map((stage) => (
                                            <div
                                                key={stage}
                                                className={`ticket-mini-step ${getStageState(ticket, stage)}`}
                                            >
                                                <div className="ticket-mini-bar" />
                                                <span className="ticket-mini-label">{stage}</span>
                                            </div>
                                        ))}
                                    </div>

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
                                        <div className="appraisal-actions" style={{ marginTop: "auto", paddingTop: "0.85rem" }}>
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
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Full-view Ticket & Progress Inspection Modal */}
                {selectedTicket && (
                    <div
                        className="modal-backdrop"
                        onClick={() => {
                            setSelectedTicketId(null);
                            setActivePhotoIndex(0);
                        }}
                    >
                        <div
                            className="modal-card modal-card--lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-head">
                                <div>
                                    <p className="eyebrow" style={{ marginBottom: "0.2rem" }}>ATELIER TICKET &amp; PROGRESS INSPECTION</p>
                                    <h2>{selectedTicket.ticketNumber} — {selectedTicket.watchBrand} {selectedTicket.watchModel}</h2>
                                </div>
                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() => {
                                        setSelectedTicketId(null);
                                        setActivePhotoIndex(0);
                                    }}
                                    aria-label="Close"
                                >
                                    &times;
                                </button>
                            </div>

                            {/* 4-Stage Visual Progress Stepper */}
                            <div className="ticket-progress-stepper">
                                {TICKET_STAGES.map((stage, idx) => {
                                    const historyEntry = (selectedTicket.statusHistory || []).find((h) => h.status === stage);
                                    const currentIdx = TICKET_STAGES.indexOf(selectedTicket.status);
                                    const isCurrent = selectedTicket.status === stage;
                                    const isDone = Boolean(historyEntry) || idx < currentIdx;
                                    const isCompletedFinal = selectedTicket.status === "Completed" && stage === "Completed";

                                    const stepClass = isCompletedFinal
                                        ? "is-completed-final"
                                        : isCurrent
                                          ? "is-current"
                                          : isDone
                                            ? "is-done"
                                            : "";

                                    return (
                                        <div key={stage} className={`ticket-step ${stepClass}`}>
                                            <div className="ticket-step-indicator">
                                                {isDone || isCompletedFinal ? "✓" : idx + 1}
                                            </div>
                                            <div className="ticket-step-info">
                                                <span className="ticket-step-title">{stage}</span>
                                                <span className="ticket-step-time">
                                                    {historyEntry
                                                        ? new Date(historyEntry.changedAt).toLocaleString("en-PH", {
                                                              month: "short",
                                                              day: "numeric",
                                                              hour: "2-digit",
                                                              minute: "2-digit"
                                                          })
                                                        : isCurrent
                                                          ? "Current stage"
                                                          : "Upcoming"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="appraisal-expand-modal-grid">
                                {/* Gallery Area */}
                                <div className="appraisal-expand-gallery">
                                    {selectedTicket.photos?.length > 0 ? (
                                        <>
                                            <div className="appraisal-expand-main-img-box">
                                                <img
                                                    src={selectedTicket.photos[activePhotoIndex]?.url || selectedTicket.photos[0]?.url}
                                                    alt={`${selectedTicket.watchBrand} ${selectedTicket.watchModel}`}
                                                    className="appraisal-expand-main-img"
                                                />
                                                {selectedTicket.photos.length > 1 && (
                                                    <div className="appraisal-expand-img-counter">
                                                        Photo {activePhotoIndex + 1} of {selectedTicket.photos.length}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedTicket.photos.length > 1 && (
                                                <div className="appraisal-expand-thumbs">
                                                    {selectedTicket.photos.map((photo, i) => (
                                                        <button
                                                            key={photo.public_id || photo.url || i}
                                                            type="button"
                                                            className={`appraisal-expand-thumb-btn ${i === activePhotoIndex ? "is-active" : ""}`}
                                                            onClick={() => setActivePhotoIndex(i)}
                                                            title={`View photo ${i + 1}`}
                                                        >
                                                            <img src={photo.url} alt="" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="ticket-no-photos-box">
                                            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.4">
                                                <circle cx="12" cy="12" r="6" />
                                                <path d="M12 9v3l2 1.5M9 6.5 9.6 2h4.8l.6 4.5M9 17.5l.6 4.5h4.8l.6-4.5" />
                                            </svg>
                                            <strong style={{ color: "var(--ivory)", fontSize: "0.92rem" }}>No Reference Photos Attached</strong>
                                            <span style={{ fontSize: "0.78rem", maxWidth: "260px" }}>
                                                The collector submitted this support ticket without optional watch photographs.
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Details, Timeline & Actions */}
                                <div className="appraisal-expand-details">
                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>COLLECTOR &amp; TIMEPIECE</p>
                                        <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.4rem", color: "var(--ivory)" }}>
                                            {selectedTicket.watchBrand} {selectedTicket.watchModel}
                                        </h3>
                                        <div className="appraisal-expand-collector-box">
                                            <div>
                                                <span className="appraisal-label">Collector</span>
                                                <strong>{selectedTicket.user?.name || "Collector"}</strong>
                                            </div>
                                            <div>
                                                <span className="appraisal-label">Email</span>
                                                <span style={{ fontSize: "0.78rem", wordBreak: "break-all" }}>
                                                    {selectedTicket.user?.email || "N/A"}
                                                </span>
                                            </div>
                                            {selectedTicket.user?.contactNumber && (
                                                <div>
                                                    <span className="appraisal-label">Contact</span>
                                                    <span>{selectedTicket.user.contactNumber}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="appraisal-label">Opened On</span>
                                                <span>
                                                    {new Date(selectedTicket.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.45rem" }}>SERVICE SPECIFICATION &amp; ISSUE</p>
                                        <div className="appraisal-specs-table" style={{ gridTemplateColumns: "1fr", marginBottom: "0.65rem" }}>
                                            <div className="appraisal-spec-row">
                                                <span>Requested Service</span>
                                                <strong>{selectedTicket.service?.name || "Atelier Maintenance"}</strong>
                                            </div>
                                            {selectedTicket.service?.price !== undefined && (
                                                <div className="appraisal-spec-row">
                                                    <span>Service Fee</span>
                                                    <strong style={{ color: "var(--gold)" }}>{formatPrice(selectedTicket.service.price)}</strong>
                                                </div>
                                            )}
                                            <div className="appraisal-spec-row">
                                                <span>Current Stage</span>
                                                <span className={`badge ${STATUS_CLASS[selectedTicket.status] || "unverified-badge"}`}>
                                                    {selectedTicket.status}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="appraisal-label">Problem Description</span>
                                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, background: "var(--bg-elevated)", padding: "0.75rem 0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                                            {selectedTicket.problemDescription}
                                        </p>
                                    </div>

                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.35rem" }}>CHRONOLOGICAL STATUS LOG</p>
                                        <ol className="ticket-timeline" style={{ marginTop: "0.45rem" }}>
                                            {(selectedTicket.statusHistory || []).map((entry, index) => (
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
                                    </div>

                                    {(TICKET_STATUS_FLOW[selectedTicket.status] || []).length > 0 && (
                                        <div className="appraisal-modal-actions">
                                            <p className="appraisal-label" style={{ marginBottom: "0.45rem" }}>
                                                Advance Ticket Progress
                                            </p>
                                            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                                                {(TICKET_STATUS_FLOW[selectedTicket.status] || []).map((nextStatus) => (
                                                    <button
                                                        key={nextStatus}
                                                        type="button"
                                                        className={nextStatus === "Completed" ? "gold-button" : "admin-btn edit-btn"}
                                                        onClick={() => handleStatusChange(selectedTicket, nextStatus)}
                                                        disabled={mutationLoading}
                                                    >
                                                        Move to {nextStatus}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                                <button
                                    type="button"
                                    className="admin-btn"
                                    onClick={() => {
                                        setSelectedTicketId(null);
                                        setActivePhotoIndex(0);
                                    }}
                                >
                                    Close Inspection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default AdminTicketsPage;
