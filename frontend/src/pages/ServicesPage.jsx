import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getServices, getMyTickets, createTicket } from "../redux/actions/serviceActions";
import { TICKET_CREATE_RESET } from "../redux/constants/serviceConstants";
import { ticketSchema } from "../utils/validationSchemas";
import { showNotification } from "../utils/notification";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";
import { AureoSelect } from "../components/ui";

const MAX_PHOTOS = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
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

function ServicesPage() {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { services, loading, error } = useSelector((state) => state.serviceList);
    const { tickets } = useSelector((state) => state.ticketList);
    const { loading: creating, success } = useSelector((state) => state.ticketCreate);

    const [selectedServiceId, setSelectedServiceId] = useState("");
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    // Expandable ticket modal state for collector view
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(ticketSchema),
        mode: "onBlur",
        defaultValues: {
            service: "",
            watchBrand: "",
            watchModel: "",
            problemDescription: ""
        }
    });

    useEffect(() => {
        dispatch(getServices());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getMyTickets());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        if (success) {
            showNotification({
                type: "success",
                message: "Your support ticket has been opened successfully."
            });
            dispatch({ type: TICKET_CREATE_RESET });
            reset({ service: "", watchBrand: "", watchModel: "", problemDescription: "" });
            setSelectedServiceId("");
            setFiles([]);
            setPreviews([]);
            dispatch(getMyTickets());
        }
    }, [success, dispatch, reset]);

    const handleSelectService = (service) => {
        setSelectedServiceId(service._id);
        setValue("service", service._id, { shouldValidate: true });
        const formEl = document.getElementById("ticket-form");
        if (formEl) {
            formEl.scrollIntoView({ behavior: "smooth" });
        }
    };

    const acceptFiles = (fileList) => {
        const incoming = Array.from(fileList || []);
        if (incoming.length === 0) return;

        const combined = [...files, ...incoming];
        if (combined.length > MAX_PHOTOS) {
            showNotification({
                type: "error",
                message: `You can attach a maximum of ${MAX_PHOTOS} photos.`
            });
            return;
        }

        for (const file of incoming) {
            if (file.size > MAX_FILE_SIZE) {
                showNotification({
                    type: "error",
                    message: `File "${file.name}" exceeds the 5MB limit.`
                });
                return;
            }
        }

        setFiles(combined);
        setPreviews(combined.map((file) => URL.createObjectURL(file)));
    };

    const handleFiles = (event) => {
        acceptFiles(event.target.files);
        event.target.value = "";
    };

    const handleRemoveFile = (indexToRemove) => {
        const nextFiles = files.filter((_, idx) => idx !== indexToRemove);
        setFiles(nextFiles);
        setPreviews(nextFiles.map((file) => URL.createObjectURL(file)));
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        acceptFiles(event.dataTransfer.files);
    };

    const onSubmit = (data) => {
        const payload = new FormData();
        payload.append("service", data.service);
        payload.append("watchBrand", data.watchBrand);
        payload.append("watchModel", data.watchModel);
        payload.append("problemDescription", data.problemDescription);
        files.forEach((file) => payload.append("photos", file));

        dispatch(createTicket(payload));
    };

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
        <main className="sell-page page-enter">
            <SiteHeader variant="solid" />

            <div className="sell-container sell-container--services">
                <div className="sell-heading">
                    <p className="eyebrow">SERVICES &amp; AFTERCARE</p>
                    <h1>Keep your timepiece in its best condition</h1>
                    <p className="auth-description">
                        Expert cleaning, escapement calibration, and movement restoration carried out by our master watchmakers.
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                {loading ? (
                    <div className="service-grid">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} style={{ height: "240px", borderRadius: "12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", animation: "aureoPulseGold 2s infinite" }} />
                        ))}
                    </div>
                ) : (
                    <div className="service-grid">
                        {services.map((service) => {
                            const isSelected = selectedServiceId === service._id;
                            return (
                                <article
                                    className={`service-card ${isSelected ? "is-selected" : ""}`}
                                    key={service._id}
                                    onClick={() => handleSelectService(service)}
                                >
                                    <div className="service-card__head">
                                        <h3>{service.name}</h3>
                                        {isSelected && (
                                            <span className="badge verified-badge">Selected</span>
                                        )}
                                    </div>
                                    <p className="service-card__desc">{service.description}</p>
                                    <div className="service-card__footer">
                                        <div className="service-card__price-group">
                                            <span className="service-card__price-label">Atelier Fee</span>
                                            <strong className="service-price">{formatPrice(service.price)}</strong>
                                        </div>
                                        <button
                                            type="button"
                                            className="gold-button service-card__cta"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectService(service);
                                            }}
                                        >
                                            {isSelected ? "Selected" : "Book Service"}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <section className="ticket-section" id="ticket-form" style={{ marginTop: "3.5rem" }}>
                    <p className="eyebrow">ATELIER SUPPORT</p>
                    <h2>Open a support ticket</h2>
                    <p className="auth-description">
                        Tell us what is wrong with the watch and our horology atelier will inspect it.
                    </p>

                    {!isAuthenticated ? (
                        <div style={{ textAlign: "center", padding: "2rem", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "1.2rem" }}>
                                You must be signed in to request maintenance or open a service ticket.
                            </p>
                            <Link className="gold-button" to="/login">
                                Sign in to open a ticket
                            </Link>
                        </div>
                    ) : !user?.isVerified ? (
                        <div className="auth-error" style={{ textAlign: "center", padding: "1.5rem" }}>
                            <strong>Verification Required:</strong> Please verify your email before opening a support ticket.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="admin-form sell-card">
                            <label>
                                Service
                                <AureoSelect
                                    id="ticket-service"
                                    value={selectedServiceId}
                                    onChange={(e) => {
                                        setSelectedServiceId(e.target.value);
                                        setValue("service", e.target.value, { shouldValidate: true });
                                    }}
                                    options={[
                                        { value: "", label: "Choose a service" },
                                        ...services.map((service) => ({
                                            value: service._id,
                                            label: `${service.name} (${formatPrice(service.price)})`
                                        }))
                                    ]}
                                    ariaInvalid={Boolean(errors.service)}
                                />
                                {errors.service && <span className="field-error">{errors.service.message}</span>}
                            </label>

                            <div className="form-row-2">
                                <label>
                                    Watch brand
                                    <input
                                        {...register("watchBrand")}
                                        placeholder="e.g. Seiko"
                                        aria-invalid={Boolean(errors.watchBrand)}
                                    />
                                    {errors.watchBrand && <span className="field-error">{errors.watchBrand.message}</span>}
                                </label>
                                <label>
                                    Watch model
                                    <input
                                        {...register("watchModel")}
                                        placeholder="e.g. Presage Cocktail Time"
                                        aria-invalid={Boolean(errors.watchModel)}
                                    />
                                    {errors.watchModel && <span className="field-error">{errors.watchModel.message}</span>}
                                </label>
                            </div>

                            <label>
                                Problem description
                                <textarea
                                    rows={4}
                                    {...register("problemDescription")}
                                    placeholder="Describe the issue, for example the watch loses about two minutes a day."
                                    aria-invalid={Boolean(errors.problemDescription)}
                                />
                                {errors.problemDescription && <span className="field-error">{errors.problemDescription.message}</span>}
                            </label>

                            <div className="upload-field">
                                <span className="upload-label">
                                    Photographs (Optional) &mdash; dial, caseback, or issue area (max {MAX_PHOTOS})
                                </span>
                                <label
                                    htmlFor="ticket-photo-upload"
                                    className={`upload-zone${isDragging ? " is-dragging" : ""}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <svg
                                        className="upload-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    <span className="upload-title">Drag reference photos here or click to browse (Optional)</span>
                                    <span className="upload-subtext">
                                        JPG or PNG &middot; max 5 MB per photo &middot; optional &middot; up to {MAX_PHOTOS} photos
                                    </span>
                                    <input
                                        id="ticket-photo-upload"
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        multiple
                                        onChange={handleFiles}
                                        style={{ display: "none" }}
                                    />
                                </label>

                                {previews.length > 0 && (
                                    <div className="upload-preview-grid">
                                        {previews.map((src, index) => (
                                            <div key={src} className="upload-thumb-wrap">
                                                <img src={src} alt={`Ticket preview ${index + 1}`} className="upload-thumb" />
                                                <button
                                                    type="button"
                                                    className="upload-thumb-remove"
                                                    onClick={() => handleRemoveFile(index)}
                                                    title="Remove photo"
                                                    aria-label={`Remove photo ${index + 1}`}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="submit" className="gold-button" disabled={creating}>
                                    {creating ? "Opening ticket..." : "Open ticket"}
                                </button>
                            </div>
                        </form>
                    )}
                </section>

                {isAuthenticated && tickets.length > 0 && (
                    <section className="ticket-section" style={{ marginTop: "3.5rem" }}>
                        <h2>Your tickets</h2>
                        <div className="ticket-list">
                            {tickets.map((ticket) => {
                                const photoCount = ticket.photos?.length || 0;
                                const displayCount = Math.min(photoCount, 3);

                                return (
                                    <article className="ticket-card ticket-card--expandable" key={ticket._id}>
                                        {photoCount > 0 && (
                                            <div
                                                className={`appraisal-photos appraisal-photos--${displayCount}`}
                                                onClick={() => {
                                                    setSelectedTicket(ticket);
                                                    setActivePhotoIndex(0);
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                title="Click to expand ticket photos and progress"
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
                                                <strong>{ticket.ticketNumber}</strong>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <button
                                                        type="button"
                                                        className="appraisal-expand-btn"
                                                        onClick={() => {
                                                            setSelectedTicket(ticket);
                                                            setActivePhotoIndex(0);
                                                        }}
                                                        title="Expand ticket details & progress"
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="15 3 21 3 21 9" />
                                                            <polyline points="9 21 3 21 3 15" />
                                                            <line x1="21" y1="3" x2="14" y2="10" />
                                                            <line x1="3" y1="21" x2="10" y2="14" />
                                                        </svg>
                                                        <span>Expand</span>
                                                    </button>
                                                    <span className={`badge ${STATUS_CLASS[ticket.status] || "verified-badge"}`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="appraisal-meta">
                                                {ticket.service?.name} &bull; {ticket.watchBrand} {ticket.watchModel}
                                            </p>
                                            <p className="appraisal-meta">{ticket.problemDescription}</p>

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
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Collector Expandable Ticket Inspection Modal */}
                {selectedTicket && (
                    <div
                        className="modal-backdrop"
                        onClick={() => {
                            setSelectedTicket(null);
                            setActivePhotoIndex(0);
                        }}
                    >
                        <div
                            className="modal-card modal-card--lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-head">
                                <div>
                                    <p className="eyebrow" style={{ marginBottom: "0.2rem" }}>SERVICE TICKET PROGRESS</p>
                                    <h2>{selectedTicket.ticketNumber}</h2>
                                </div>
                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() => {
                                        setSelectedTicket(null);
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
                                                          ? "In progress"
                                                          : "Pending"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="appraisal-expand-modal-grid">
                                {/* Gallery or Placeholder */}
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
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.4">
                                                <circle cx="12" cy="12" r="6" />
                                                <path d="M12 9v3l2 1.5M9 6.5 9.6 2h4.8l.6 4.5M9 17.5l.6 4.5h4.8l.6-4.5" />
                                            </svg>
                                            <strong style={{ color: "var(--ivory)", fontSize: "0.9rem" }}>No reference photos attached</strong>
                                            <span style={{ fontSize: "0.78rem" }}>
                                                This support ticket was opened without optional photographs.
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Details & Timeline */}
                                <div className="appraisal-expand-details">
                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>TIMEPIECE &amp; SERVICE</p>
                                        <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.4rem", color: "var(--ivory)" }}>
                                            {selectedTicket.watchBrand} {selectedTicket.watchModel}
                                        </h3>
                                        <div className="appraisal-specs-table" style={{ gridTemplateColumns: "1fr" }}>
                                            <div className="appraisal-spec-row">
                                                <span>Booked Service</span>
                                                <strong>{selectedTicket.service?.name || "Atelier Service"}</strong>
                                            </div>
                                            {selectedTicket.service?.price !== undefined && (
                                                <div className="appraisal-spec-row">
                                                    <span>Estimated Service Fee</span>
                                                    <strong style={{ color: "var(--gold)" }}>{formatPrice(selectedTicket.service.price)}</strong>
                                                </div>
                                            )}
                                            <div className="appraisal-spec-row">
                                                <span>Current Status</span>
                                                <span className={`badge ${STATUS_CLASS[selectedTicket.status] || "verified-badge"}`}>
                                                    {selectedTicket.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.35rem" }}>REPORTED ISSUE</p>
                                        <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-secondary)", lineHeight: 1.6, background: "var(--bg-elevated)", padding: "0.75rem 0.9rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                                            {selectedTicket.problemDescription}
                                        </p>
                                    </div>

                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.35rem" }}>ATELIER PROGRESS LOG</p>
                                        <ol className="ticket-timeline" style={{ marginTop: "0.5rem" }}>
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
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                                <button
                                    type="button"
                                    className="admin-btn"
                                    onClick={() => {
                                        setSelectedTicket(null);
                                        setActivePhotoIndex(0);
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <SiteFooter />
        </main>
    );
}

export default ServicesPage;
