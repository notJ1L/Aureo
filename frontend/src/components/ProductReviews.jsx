import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import api from "../services/api";
import { confirmAction } from "../utils/sweetAlert";

function ProductReviews({ productId, onReviewAdded }) {
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canReview, setCanReview] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState(null);
    const [ineligibleReason, setIneligibleReason] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [editingReview, setEditingReview] = useState(null);

    const loadReviews = async () => {
        try {
            const { data } = await api.get(`/product/${productId}/reviews`);
            setReviews(data.reviews || []);
            setCanReview(Boolean(data.canReview));
            setPurchaseStatus(data.purchaseStatus || null);
            setIneligibleReason(data.ineligibleReason || "");
        } catch (err) {
            console.error("Failed to fetch reviews", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        api
            .get(`/product/${productId}/reviews`)
            .then(({ data }) => {
                if (active) {
                    setReviews(data.reviews || []);
                    setCanReview(Boolean(data.canReview));
                    setPurchaseStatus(data.purchaseStatus || null);
                    setIneligibleReason(data.ineligibleReason || "");
                }
            })
            .catch((err) => {
                console.error("Failed to fetch reviews", err);
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [productId, isAuthenticated, user?._id]);

    const resetForm = () => {
        setRating(5);
        setComment("");
        setEditingReview(null);
        setErrorMsg("");
        setSuccessMsg("");
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        setSubmitting(true);

        try {
            if (editingReview) {
                // FR 6.1 / MP3: the owner updates their own review.
                await api.put(`/review/${editingReview._id}`, {
                    rating: Number(rating),
                    comment
                });
                setSuccessMsg("Your review has been updated.");
                toast.success("Review updated");
            } else {
                await api.post(`/product/${productId}/review`, {
                    rating: Number(rating),
                    comment
                });
                setSuccessMsg("Your review has been submitted to the Aureo register.");
                toast.success("Review submitted");
            }

            resetForm();
            loadReviews();
            if (onReviewAdded) onReviewAdded();
        } catch (err) {
            const message =
                err.response?.data?.message ||
                "Failed to submit review. Note: Only verified customers who acquired this piece may leave a review.";

            setErrorMsg(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStartEdit = (review) => {
        setEditingReview(review);
        setRating(review.rating);
        setComment(review.comment);
        setErrorMsg("");
        setSuccessMsg("");
    };

    const handleDeleteReview = async (reviewId) => {
        const confirmed = await confirmAction({
            title: "Remove this review?",
            message: "The review will be removed from the product page.",
            confirmText: "Remove review"
        });

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/review/${reviewId}`);
            toast.success("Review removed");
            loadReviews();
            if (onReviewAdded) onReviewAdded();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove review");
        }
    };

    return (
        <section className="product-reviews-section">
            <div className="reviews-head">
                <h2>Reviews</h2>
                <span className="review-count-badge">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
            </div>

            {/* Submission Form */}
            {!isAuthenticated ? (
                <div className="review-login-prompt">
                    <a href="/login">Sign in</a>
                    <span> to leave a review.</span>
                </div>
            ) : canReview || editingReview ? (
                <div className="review-form-card">
                    <h3>Write a review</h3>
                    <p className="review-disclaimer">
                        Verified Collector — your order for this timepiece has been delivered.
                    </p>

                    {errorMsg && <div className="auth-error">{errorMsg}</div>}
                    {successMsg && <div className="auth-info">{successMsg}</div>}

                    <form onSubmit={handleSubmitReview} className="review-form">
                        {editingReview && (
                            <p className="field-hint">
                                You are editing your existing review. Submitting updates it.
                            </p>
                        )}

                        <div className="star-rating-select">
                            <label>Rating:</label>
                            <div className="star-buttons">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        className={`star-btn ${rating >= star ? "filled" : ""}`}
                                        onClick={() => setRating(star)}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="rating-num-label">({rating} of 5 Stars)</span>
                            </div>
                        </div>

                        <label>
                            Your review
                            <textarea
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience with this watch"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            className="gold-button submit-review-btn"
                            disabled={submitting}
                        >
                            {submitting ? "Submitting…" : "Submit review"}
                        </button>
                    </form>
                </div>
            ) : !loading ? (
                <div className="review-login-prompt">
                    <span>
                        {purchaseStatus && ["Pending", "Paid", "Shipped"].includes(purchaseStatus)
                            ? `Your order for this timepiece is currently "${purchaseStatus}". You can write a review once it has been delivered (Completed).`
                            : ineligibleReason || "Only verified collectors who have purchased and received this timepiece can leave a review."}
                    </span>
                </div>
            ) : null}

            {/* Reviews List */}
            {loading ? (
                <p className="loading-state">Loading reviews…</p>
            ) : reviews.length === 0 ? (
                <div className="empty-reviews">
                    <p>No reviews yet.</p>
                </div>
            ) : (
                <div className="reviews-list">
                    {reviews.map((rev) => {
                        const isOwner = user && rev.user?._id === user._id;
                        const isAdmin = user && user.role === "admin";

                        return (
                            <article className="review-card" key={rev._id}>
                                <div className="review-user-row">
                                    <div className="review-user-info">
                                        <img
                                            src={rev.user?.avatar?.url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"}
                                            alt={rev.user?.name || "Client"}
                                            className="review-user-avatar"
                                        />
                                        <div>
                                            <strong className="review-user-name">{rev.user?.name || "Aureo Collector"}</strong>
                                            <span className="review-date">
                                                {new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="review-rating-stars">
                                        {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                    </div>
                                </div>

                                <p className="review-body">{rev.comment}</p>

                                {(isOwner || isAdmin) && (
                                    <div className="review-actions">
                                        {isOwner && (
                                            <button
                                                type="button"
                                                className="edit-review-link"
                                                onClick={() => handleStartEdit(rev)}
                                            >
                                                Edit Review
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="delete-review-link"
                                            onClick={() => handleDeleteReview(rev._id)}
                                        >
                                            Delete Review
                                        </button>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default ProductReviews;
