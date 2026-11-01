import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
    getAdminAppraisals,
    reviewAppraisal,
    convertAppraisal,
    clearAppraisalErrors
} from "../../redux/actions/appraisalActions";
import {
    ADMIN_APPRAISAL_REVIEW_RESET,
    ADMIN_APPRAISAL_CONVERT_RESET
} from "../../redux/constants/appraisalConstants";
import { confirmAction } from "../../utils/sweetAlert";
import AdminHeader from "../../components/layout/AdminHeader";
import { AureoSelect } from "../../components/ui";

const STATUS_CLASS = {
    Pending: "unverified-badge",
    "Offer Made": "preowned-badge",
    Accepted: "verified-badge",
    Rejected: "del-btn"
};

const formatPrice = (price) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0
    }).format(price || 0);

function AdminAppraisalsPage() {
    const dispatch = useDispatch();
    const { appraisals, loading, error } = useSelector((state) => state.adminAppraisals);
    const {
        loading: actionLoading,
        isReviewed,
        isConverted,
        error: actionError
    } = useSelector((state) => state.adminAppraisalAction);

    const [offerInputs, setOfferInputs] = useState({});
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedAppraisal, setSelectedAppraisal] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    useEffect(() => {
        dispatch(getAdminAppraisals());
    }, [dispatch]);

    useEffect(() => {
        if (isReviewed) {
            toast.success("Appraisal updated.");
            dispatch({ type: ADMIN_APPRAISAL_REVIEW_RESET });
            dispatch(getAdminAppraisals());
        }
        if (isConverted) {
            toast.success("Appraisal converted into a second-hand listing.");
            dispatch({ type: ADMIN_APPRAISAL_CONVERT_RESET });
            dispatch(getAdminAppraisals());
        }
    }, [isReviewed, isConverted, dispatch]);

    useEffect(() => {
        return () => {
            dispatch(clearAppraisalErrors());
        };
    }, [dispatch]);

    const handleOffer = async (appraisal) => {
        const value = Number(offerInputs[appraisal._id]);

        if (!Number.isFinite(value) || value < 0) {
            toast.error("Enter a valid offer price first.");
            return;
        }

        const confirmed = await confirmAction({
            title: "Send this offer?",
            message: `${appraisal.brand} ${appraisal.model} will be offered ${formatPrice(value)}.`,
            confirmText: "Send offer",
            danger: false
        });

        if (confirmed) {
            dispatch(reviewAppraisal(appraisal._id, { offerPrice: value }));
        }
    };

    const handleReject = async (appraisal) => {
        const confirmed = await confirmAction({
            title: "Reject this appraisal?",
            message: `${appraisal.brand} ${appraisal.model} will be closed and the collector notified.`,
            confirmText: "Reject appraisal"
        });

        if (confirmed) {
            dispatch(reviewAppraisal(appraisal._id, { action: "reject" }));
        }
    };

    const handleConvert = async (appraisal) => {
        const confirmed = await confirmAction({
            title: "Convert into a listing?",
            message: "An active second-hand listing with a stock of one will be created.",
            confirmText: "Create listing"
        });

        if (confirmed) {
            dispatch(convertAppraisal(appraisal._id));
        }
    };

    const visible = (appraisals || []).filter(
        (appraisal) => !statusFilter || appraisal.status === statusFilter
    );

    return (
        <main className="admin-page">
            <AdminHeader />

            <div className="admin-container">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">APPRAISAL DESK</p>
                        <h1>Collector Appraisals</h1>
                    </div>
                    <div style={{ width: "220px" }}>
                        <AureoSelect
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: "", label: "All statuses" },
                                ...["Pending", "Offer Made", "Accepted", "Rejected"].map((status) => ({
                                    value: status,
                                    label: status
                                }))
                            ]}
                        />
                    </div>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {actionError && <div className="auth-error">{actionError}</div>}

                {loading && <p className="catalog-message">Loading appraisals...</p>}

                {!loading && visible.length === 0 && (
                    <div className="empty-state">
                        <p>No appraisals match this view.</p>
                        <span>Collector submissions appear here for review.</span>
                    </div>
                )}

                <div className="appraisal-grid">
                    {visible.map((appraisal) => {
                        const photoCount = appraisal.photos?.length || 0;
                        const displayCount = Math.min(photoCount, 3);

                        return (
                            <article className="appraisal-card" key={appraisal._id}>
                                <div
                                    className={`appraisal-photos appraisal-photos--${displayCount}`}
                                    onClick={() => {
                                        setSelectedAppraisal(appraisal);
                                        setActivePhotoIndex(0);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    title="Click to expand photos and inspection details"
                                >
                                    {photoCount === 0 ? (
                                        <div className="appraisal-photo-item appraisal-photos--0">
                                            <span>No photos provided</span>
                                        </div>
                                    ) : (
                                        (appraisal.photos || []).slice(0, 3).map((photo, idx) => {
                                            const isLastAndMore = idx === 2 && photoCount > 3;
                                            return (
                                                <div key={photo.public_id || photo.url || idx} className="appraisal-photo-item">
                                                    <img src={photo.url} alt={`${appraisal.brand} ${appraisal.model}`} />
                                                    {isLastAndMore && (
                                                        <div className="appraisal-photo-more">
                                                            +{photoCount - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
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

                                <div className="appraisal-body">
                                    <div className="appraisal-head">
                                        <div>
                                            <p className="product-brand">{appraisal.brand}</p>
                                            <h3>{appraisal.model}</h3>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <button
                                                type="button"
                                                className="appraisal-expand-btn"
                                                onClick={() => {
                                                    setSelectedAppraisal(appraisal);
                                                    setActivePhotoIndex(0);
                                                }}
                                                title="Expand appraisal inspection details"
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <polyline points="9 21 3 21 3 15" />
                                                    <line x1="21" y1="3" x2="14" y2="10" />
                                                    <line x1="3" y1="21" x2="10" y2="14" />
                                                </svg>
                                                <span>Expand</span>
                                            </button>
                                            <span className={`badge ${STATUS_CLASS[appraisal.status] || "unverified-badge"}`}>
                                                {appraisal.status}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="appraisal-meta">
                                        Submitted by {appraisal.user?.name} ({appraisal.user?.email})
                                    </p>
                                    <p className="appraisal-meta">
                                        {appraisal.year} &bull; {appraisal.movement} &bull; {appraisal.caseSize}mm
                                        {appraisal.hasBox ? " • Box" : ""}
                                        {appraisal.hasPapers ? " • Papers" : ""}
                                    </p>
                                    <p className="appraisal-meta">
                                        Asking price: <strong>{formatPrice(appraisal.askingPrice)}</strong>
                                    </p>

                                    {appraisal.offerPrice !== null && appraisal.offerPrice !== undefined && (
                                        <p className="appraisal-offer">
                                            Vault Offer: <strong>{formatPrice(appraisal.offerPrice)}</strong>
                                        </p>
                                    )}

                                    {appraisal.convertedProduct && (
                                        <p className="appraisal-offer">
                                            Listed:{" "}
                                            <Link to={`/product/${appraisal.convertedProduct._id}`} className="text-link">
                                                {appraisal.convertedProduct.name}
                                            </Link>
                                        </p>
                                    )}

                                    {appraisal.status === "Pending" && (
                                        <div className="appraisal-actions">
                                            <input
                                                type="number"
                                                className="catalog-input"
                                                placeholder="Offer price"
                                                value={offerInputs[appraisal._id] || ""}
                                                onChange={(e) =>
                                                    setOfferInputs((previous) => ({
                                                        ...previous,
                                                        [appraisal._id]: e.target.value
                                                    }))
                                                }
                                            />
                                            <button
                                                type="button"
                                                className="gold-button"
                                                onClick={() => handleOffer(appraisal)}
                                                disabled={actionLoading}
                                            >
                                                Make offer
                                            </button>
                                            <button
                                                type="button"
                                                className="admin-btn del-btn"
                                                onClick={() => handleReject(appraisal)}
                                                disabled={actionLoading}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}

                                    {appraisal.status === "Accepted" && !appraisal.convertedProduct && (
                                        <div className="appraisal-actions">
                                            <button
                                                type="button"
                                                className="gold-button"
                                                onClick={() => handleConvert(appraisal)}
                                                disabled={actionLoading}
                                            >
                                                Convert to listing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Full-view Appraisal Inspection Modal */}
                {selectedAppraisal && (
                    <div
                        className="modal-backdrop"
                        onClick={() => {
                            setSelectedAppraisal(null);
                            setActivePhotoIndex(0);
                        }}
                    >
                        <div
                            className="modal-card modal-card--lg"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-head">
                                <div>
                                    <p className="eyebrow" style={{ marginBottom: "0.2rem" }}>APPRAISAL INSPECTION</p>
                                    <h2>{selectedAppraisal.brand} — {selectedAppraisal.model}</h2>
                                </div>
                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() => {
                                        setSelectedAppraisal(null);
                                        setActivePhotoIndex(0);
                                    }}
                                    aria-label="Close"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="appraisal-expand-modal-grid">
                                {/* Gallery Area */}
                                <div className="appraisal-expand-gallery">
                                    <div className="appraisal-expand-main-img-box">
                                        <img
                                            src={selectedAppraisal.photos?.[activePhotoIndex]?.url || selectedAppraisal.photos?.[0]?.url}
                                            alt={selectedAppraisal.model}
                                            className="appraisal-expand-main-img"
                                        />
                                        {selectedAppraisal.photos?.length > 1 && (
                                            <div className="appraisal-expand-img-counter">
                                                Photo {activePhotoIndex + 1} of {selectedAppraisal.photos.length}
                                            </div>
                                        )}
                                    </div>
                                    {selectedAppraisal.photos?.length > 1 && (
                                        <div className="appraisal-expand-thumbs">
                                            {selectedAppraisal.photos.map((photo, i) => (
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
                                </div>

                                {/* Details & Specs Area */}
                                <div className="appraisal-expand-details">
                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>COLLECTOR SUBMISSION</p>
                                        <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.4rem", color: "var(--ivory)" }}>
                                            {selectedAppraisal.brand} {selectedAppraisal.model}
                                        </h3>
                                        <div className="appraisal-expand-collector-box">
                                            <div>
                                                <span className="appraisal-label">Collector</span>
                                                <strong>{selectedAppraisal.user?.name || "Unknown Collector"}</strong>
                                            </div>
                                            <div>
                                                <span className="appraisal-label">Email</span>
                                                <span style={{ fontSize: "0.78rem", wordBreak: "break-all" }}>
                                                    {selectedAppraisal.user?.email || "N/A"}
                                                </span>
                                            </div>
                                            {selectedAppraisal.user?.contactNumber && (
                                                <div>
                                                    <span className="appraisal-label">Contact</span>
                                                    <span>{selectedAppraisal.user.contactNumber}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="appraisal-label">Submitted</span>
                                                <span>
                                                    {new Date(selectedAppraisal.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>PIECE SPECIFICATIONS</p>
                                        <div className="appraisal-specs-table">
                                            <div className="appraisal-spec-row">
                                                <span>Year</span>
                                                <strong>{selectedAppraisal.year}</strong>
                                            </div>
                                            <div className="appraisal-spec-row">
                                                <span>Movement</span>
                                                <strong style={{ textTransform: "capitalize" }}>{selectedAppraisal.movement}</strong>
                                            </div>
                                            <div className="appraisal-spec-row">
                                                <span>Case Diameter</span>
                                                <strong>{selectedAppraisal.caseSize} mm</strong>
                                            </div>
                                            <div className="appraisal-spec-row">
                                                <span>Condition</span>
                                                <strong style={{ textTransform: "capitalize" }}>{selectedAppraisal.condition || "Second-hand"}</strong>
                                            </div>
                                            <div className="appraisal-spec-row">
                                                <span>Original Box</span>
                                                <span className={selectedAppraisal.hasBox ? "spec-badge-yes" : "spec-badge-no"}>
                                                    {selectedAppraisal.hasBox ? "Included" : "None"}
                                                </span>
                                            </div>
                                            <div className="appraisal-spec-row">
                                                <span>Original Papers</span>
                                                <span className={selectedAppraisal.hasPapers ? "spec-badge-yes" : "spec-badge-no"}>
                                                    {selectedAppraisal.hasPapers ? "Included" : "None"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>VALUATION & STATUS</p>
                                        <div className="appraisal-valuation-box">
                                            <div>
                                                <span className="appraisal-label">Asking Price</span>
                                                <span className="appraisal-val-price">{formatPrice(selectedAppraisal.askingPrice)}</span>
                                            </div>
                                            {selectedAppraisal.offerPrice !== null && selectedAppraisal.offerPrice !== undefined && (
                                                <div>
                                                    <span className="appraisal-label">Vault Offer</span>
                                                    <span className="appraisal-val-price" style={{ color: "var(--gold)" }}>
                                                        {formatPrice(selectedAppraisal.offerPrice)}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="appraisal-label">Status</span>
                                                <span className={`badge ${STATUS_CLASS[selectedAppraisal.status] || "unverified-badge"}`}>
                                                    {selectedAppraisal.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedAppraisal.status === "Pending" && (
                                        <div className="appraisal-modal-actions">
                                            <p className="appraisal-label" style={{ marginBottom: "0.4rem" }}>Make an Offer or Reject</p>
                                            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                                                <input
                                                    type="number"
                                                    className="catalog-input"
                                                    placeholder="Offer price (PHP)"
                                                    value={offerInputs[selectedAppraisal._id] || ""}
                                                    onChange={(e) =>
                                                        setOfferInputs((previous) => ({
                                                            ...previous,
                                                            [selectedAppraisal._id]: e.target.value
                                                        }))
                                                    }
                                                    style={{ flex: "1 1 140px" }}
                                                />
                                                <button
                                                    type="button"
                                                    className="gold-button"
                                                    onClick={() => {
                                                        handleOffer(selectedAppraisal);
                                                        setSelectedAppraisal(null);
                                                    }}
                                                    disabled={actionLoading}
                                                >
                                                    Make offer
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-btn del-btn"
                                                    onClick={() => {
                                                        handleReject(selectedAppraisal);
                                                        setSelectedAppraisal(null);
                                                    }}
                                                    disabled={actionLoading}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedAppraisal.status === "Accepted" && !selectedAppraisal.convertedProduct && (
                                        <div className="appraisal-modal-actions">
                                            <button
                                                type="button"
                                                className="gold-button"
                                                style={{ width: "100%" }}
                                                onClick={() => {
                                                    handleConvert(selectedAppraisal);
                                                    setSelectedAppraisal(null);
                                                }}
                                                disabled={actionLoading}
                                            >
                                                Convert Piece to Live Listing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                                <button
                                    type="button"
                                    className="admin-btn"
                                    onClick={() => {
                                        setSelectedAppraisal(null);
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

export default AdminAppraisalsPage;
