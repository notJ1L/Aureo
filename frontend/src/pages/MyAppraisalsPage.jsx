import { useEffect } from "react";
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
                        {appraisals.map((appraisal) => (
                            <article className="appraisal-card" key={appraisal._id}>
                                <div className="appraisal-photos">
                                    {(appraisal.photos || []).slice(0, 3).map((photo) => (
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
                        ))}
                    </div>
                )}
            </div>

            <SiteFooter />
        </main>
    );
}

export default MyAppraisalsPage;
