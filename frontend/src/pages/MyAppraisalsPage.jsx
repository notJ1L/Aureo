import ModalPortal from "../components/ui/ModalPortal";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
    getMyAppraisals,
    respondToOffer,
    clearAppraisalErrors
} from "../redux/actions/appraisalActions";
import { APPRAISAL_RESPOND_RESET } from "../redux/constants/appraisalConstants";
import { confirmAction } from "../utils/sweetAlert";
import SiteHeader from "../components/layout/SiteHeader";
import SiteFooter from "../components/layout/SiteFooter";


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

function MyAppraisalsPage() {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { appraisals, loading, error } = useSelector((state) => state.appraisalList);
    const { loading: respondLoading, success } = useSelector((state) => state.appraisalRespond);

    const [selectedAppraisal, setSelectedAppraisal] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(getMyAppraisals());
        }
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        if (success) {
            toast.success("Your response was recorded.");
            dispatch({ type: APPRAISAL_RESPOND_RESET });
            dispatch(getMyAppraisals());
        }
    }, [success, dispatch]);

    useEffect(() => {
        return () => {
            dispatch(clearAppraisalErrors());
        };
    }, [dispatch]);

    const handleRespond = async (appraisal, decision) => {
        const confirmed = await confirmAction({
            title: decision === "Accepted" ? "Accept this offer?" : "Reject this offer?",
            message:
                decision === "Accepted"
                    ? `You are accepting ${formatPrice(appraisal.offerPrice)} for your ${appraisal.brand} ${appraisal.model}.`
                    : "The offer will be declined and the appraisal closed.",
            confirmText: decision === "Accepted" ? "Accept offer" : "Reject offer",
            danger: decision !== "Accepted"
        });

        if (confirmed) {
            dispatch(respondToOffer(appraisal._id, decision));
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="sell-page page-enter">
                <SiteHeader variant="solid" />
                <div className="sell-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <section className="auth-card" style={{ maxWidth: "480px", margin: "3rem auto", textAlign: "center" }}>
                        <p className="eyebrow">MY APPRAISALS</p>
                        <h1>Sign in to see your appraisals</h1>
                        <p className="auth-description">
                            Access the evaluations and offers made on your horological pieces.
                        </p>
                        <Link className="gold-button" to="/login" style={{ display: "inline-block", marginTop: "1rem" }}>
                            Sign in to Continue
                        </Link>
                    </section>
                </div>
                <SiteFooter />
            </main>
        );
    }

    return (
        <main className="sell-page page-enter">
            <SiteHeader variant="solid" />

            <div className="sell-container">
                <div className="sell-heading">
                    <p className="eyebrow">CONSIGNMENT &amp; ACQUISITIONS</p>
                    <h1>Your Appraisal Archive</h1>
                    <p className="auth-description">
                        Track the assessment status, curatorial notes, and cash offers made on timepieces offered to the vault.
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                {loading ? (
                    <div className="appraisal-grid">
                        {[1, 2].map((n) => (
                            <div key={n} style={{ height: "240px", borderRadius: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", animation: "aureoPulseGold 2s infinite" }} />
                        ))}
                    </div>
                ) : appraisals.length === 0 && !error ? (
                    <div className="empty-state">
                        <p>You have not submitted an appraisal yet.</p>
                        <span>Offer a piece from your private collection and our horologists will assess it.</span>
                        <Link className="gold-button" to="/sell" style={{ marginTop: "1.2rem", display: "inline-block" }}>
                            Sell Your Watch
                        </Link>
                    </div>
                ) : (
                    <div className="appraisal-grid">
                        {appraisals.map((appraisal) => {
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
                                        title="Click to expand photos and details"
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
                                            {appraisal.year} &bull; {appraisal.movement} &bull; {appraisal.caseSize}mm
                                            {appraisal.hasBox ? " • Box" : ""}
                                            {appraisal.hasPapers ? " • Papers" : ""}
                                        </p>

                                        <p className="appraisal-meta">
                                            Asking price: <strong>{formatPrice(appraisal.askingPrice)}</strong>
                                        </p>

                                        {appraisal.offerPrice !== null && appraisal.offerPrice !== undefined && (
                                            <p className="appraisal-offer">
                                                Vault Cash Offer: <strong>{formatPrice(appraisal.offerPrice)}</strong>
                                            </p>
                                        )}

                                        {appraisal.convertedProduct && (
                                            <p className="appraisal-offer">
                                                Listed in the vault:{" "}
                                                <Link to={`/product/${appraisal.convertedProduct._id}`} className="text-link" style={{ color: "var(--gold)" }}>
                                                    {appraisal.convertedProduct.name}
                                                </Link>
                                            </p>
                                        )}

                                        {appraisal.status === "Offer Made" && (
                                            <div className="appraisal-actions" style={{ display: "flex", gap: "0.8rem", marginTop: "1rem" }}>
                                                <button
                                                    type="button"
                                                    className="gold-button"
                                                    onClick={() => handleRespond(appraisal, "Accepted")}
                                                    disabled={respondLoading}
                                                >
                                                    Accept Offer
                                                </button>
                                                <button
                                                    type="button"
                                                    className="outline-button"
                                                    onClick={() => handleRespond(appraisal, "Rejected")}
                                                    disabled={respondLoading}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Collector Inspection Modal */}
                {selectedAppraisal && (
                    <ModalPortal>
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

                                <div className="appraisal-expand-details">
                                    <div className="appraisal-spec-section">
                                        <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>YOUR SUBMISSION</p>
                                        <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.4rem", color: "var(--ivory)" }}>
                                            {selectedAppraisal.brand} {selectedAppraisal.model}
                                        </h3>
                                        <p className="appraisal-meta">
                                            Submitted on {new Date(selectedAppraisal.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                        </p>
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
                                        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>VALUATION</p>
                                        <div className="appraisal-valuation-box">
                                            <div>
                                                <span className="appraisal-label">Your Asking Price</span>
                                                <span className="appraisal-val-price">{formatPrice(selectedAppraisal.askingPrice)}</span>
                                            </div>
                                            {selectedAppraisal.offerPrice !== null && selectedAppraisal.offerPrice !== undefined && (
                                                <div>
                                                    <span className="appraisal-label">Vault Cash Offer</span>
                                                    <span className="appraisal-val-price" style={{ color: "var(--gold)" }}>
                                                        {formatPrice(selectedAppraisal.offerPrice)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedAppraisal.status === "Offer Made" && (
                                        <div className="appraisal-modal-actions">
                                            <p className="appraisal-label" style={{ marginBottom: "0.5rem" }}>Vault Offer Decision</p>
                                            <div style={{ display: "flex", gap: "0.8rem" }}>
                                                <button
                                                    type="button"
                                                    className="gold-button"
                                                    onClick={() => {
                                                        handleRespond(selectedAppraisal, "Accepted");
                                                        setSelectedAppraisal(null);
                                                    }}
                                                    disabled={respondLoading}
                                                >
                                                    Accept Offer
                                                </button>
                                                <button
                                                    type="button"
                                                    className="outline-button"
                                                    onClick={() => {
                                                        handleRespond(selectedAppraisal, "Rejected");
                                                        setSelectedAppraisal(null);
                                                    }}
                                                    disabled={respondLoading}
                                                >
                                                    Decline
                                                </button>
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
                                        setSelectedAppraisal(null);
                                        setActivePhotoIndex(0);
                                    }}
                                >
                                    Close Inspection
                                </button>
                            </div>
                        </div>
                    </div>
                    </ModalPortal>
                )}
            </div>

            <SiteFooter />
        </main>
    );
}

export default MyAppraisalsPage;
