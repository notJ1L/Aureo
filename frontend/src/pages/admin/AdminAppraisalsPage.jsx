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
            <header className="admin-header-bar">
                <div>
                    <Link to="/" className="logo">AUREO</Link>
                    <span className="admin-tag">ADMIN VAULT</span>
                </div>
                <div className="admin-nav-actions">
                    <Link to="/admin/products" className="outline-button">Inventory</Link>
                    <Link to="/admin/orders" className="outline-button">Orders</Link>
                    <Link to="/me" className="nav-action">Account</Link>
                </div>
            </header>

            <div className="admin-container">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">APPRAISAL DESK</p>
                        <h1>Collector Appraisals</h1>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="catalog-select"
                        style={{ maxWidth: "220px" }}
                    >
                        <option value="">All statuses</option>
                        {["Pending", "Offer Made", "Accepted", "Rejected"].map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
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
                    {visible.map((appraisal) => (
                        <article className="appraisal-card" key={appraisal._id}>
                            <div className="appraisal-photos">
                                {(appraisal.photos || []).slice(0, 4).map((photo) => (
                                    <img key={photo.public_id || photo.url} src={photo.url} alt={appraisal.model} />
                                ))}
                            </div>

                            <div className="appraisal-body">
                                <div className="appraisal-head">
                                    <div>
                                        <p className="product-brand">{appraisal.brand}</p>
                                        <h3>{appraisal.model}</h3>
                                    </div>
                                    <span className={`badge ${STATUS_CLASS[appraisal.status] || "unverified-badge"}`}>
                                        {appraisal.status}
                                    </span>
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
                    ))}
                </div>
            </div>
        </main>
    );
}

export default AdminAppraisalsPage;
