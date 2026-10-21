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
            <main className="auth-page">
                <Link className="auth-back" to="/">← Back to store</Link>
                <section className="auth-card">
                    <p className="eyebrow">MY APPRAISALS</p>
                    <h1>Sign in to see your appraisals</h1>
                    <Link className="gold-button" to="/login" style={{ display: "inline-block", textAlign: "center" }}>
                        Sign in
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="sell-page">
            <header className="navbar">
                <Link className="logo" to="/">AUREO</Link>
                <nav className="nav-links">
                    <Link to="/catalog">Collection</Link>
                    <Link to="/sell">Sell your watch</Link>
                    <Link to="/appraisals">My appraisals</Link>
                </nav>
                <div className="nav-actions">
                    <Link className="nav-action" to="/me" style={{ color: "var(--gold)" }}>
                        {user?.name?.split(" ")[0] || "Account"}
                    </Link>
                </div>
            </header>

            <div className="sell-container">
                <div className="sell-heading">
                    <p className="eyebrow">MY APPRAISALS</p>
                    <h1>Your appraisal requests</h1>
                    <p className="auth-description">
                        Track the status of every watch you offered to the vault.
                    </p>
                </div>

                {error && <div className="auth-error">{error}</div>}

                {loading && <p className="catalog-message">Loading your appraisals...</p>}

                {!loading && appraisals.length === 0 && !error && (
                    <div className="empty-state">
                        <p>You have not submitted an appraisal yet.</p>
                        <span>Offer a piece from your collection and our team will review it.</span>
                        <Link className="gold-button" to="/sell" style={{ marginTop: "1rem" }}>
                            Sell your watch
                        </Link>
                    </div>
                )}

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
                                        Our offer: <strong>{formatPrice(appraisal.offerPrice)}</strong>
                                    </p>
                                )}

                                {appraisal.convertedProduct && (
                                    <p className="appraisal-offer">
                                        Listed in the vault:{" "}
                                        <Link to={`/product/${appraisal.convertedProduct._id}`} className="text-link">
                                            {appraisal.convertedProduct.name}
                                        </Link>
                                    </p>
                                )}

                                {appraisal.status === "Offer Made" && (
                                    <div className="appraisal-actions">
                                        <button
                                            type="button"
                                            className="gold-button"
                                            onClick={() => handleRespond(appraisal, "Accepted")}
                                            disabled={respondLoading}
                                        >
                                            Accept offer
                                        </button>
                                        <button
                                            type="button"
                                            className="outline-button"
                                            onClick={() => handleRespond(appraisal, "Rejected")}
                                            disabled={respondLoading}
                                        >
                                            Reject
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

export default MyAppraisalsPage;
