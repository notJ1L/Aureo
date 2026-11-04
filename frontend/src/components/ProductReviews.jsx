import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
    getProductReviews,
    submitProductReview,
    updateProductReview,
    deleteProductReview
} from "../redux/actions/productActions";
import { reviewSchema } from "../utils/validationSchemas";
import { confirmAction } from "../utils/sweetAlert";
import { showNotification } from "../utils/notification";

function ProductReviews({ productId, onReviewAdded }) {
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const {
        reviews = [],
        canReview = false,
        purchaseStatus = null,
        ineligibleReason = "",
        loading = false
    } = useSelector((state) => state.productReviews || {});
    const { loading: submitting = false } = useSelector((state) => state.reviewMutation || {});

    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [editingReview, setEditingReview] = useState(null);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        control,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(reviewSchema),
        mode: "onBlur",
        defaultValues: { rating: 5, comment: "" }
    });

    const rating = useWatch({ control, name: "rating" }) || 5;

    useEffect(() => {
        if (productId) {
            dispatch(getProductReviews(productId));
        }
    }, [dispatch, productId, isAuthenticated, user?._id]);

    const resetForm = () => {
        reset({ rating: 5, comment: "" });
        setEditingReview(null);
        setErrorMsg("");
        setSuccessMsg("");
    };

    const onSubmitReview = async (values) => {
        setErrorMsg("");
        setSuccessMsg("");

        if (editingReview) {
            const result = await dispatch(
                updateProductReview(editingReview._id, {
                    rating: Number(values.rating),
                    comment: values.comment
                })
            );

            if (result?.success) {
                setSuccessMsg("Your review has been updated.");
                showNotification({
                    type: "success",
                    message: "Review updated successfully."
                });
                resetForm();
                dispatch(getProductReviews(productId));
                if (onReviewAdded) onReviewAdded();
            } else {
                setErrorMsg(result?.message || "Failed to update review.");
                showNotification({
                    type: "error",
                    message: result?.message || "Failed to update review."
                });
            }
        } else {
            const result = await dispatch(
                submitProductReview(productId, {
                    rating: Number(values.rating),
                    comment: values.comment
                })
            );

            if (result?.success) {
                setSuccessMsg("Your review has been submitted to the Aureo register.");
                showNotification({
                    type: "success",
                    message: "Review submitted successfully."
                });
                resetForm();
                dispatch(getProductReviews(productId));
                if (onReviewAdded) onReviewAdded();
            } else {
                setErrorMsg(result?.message || "Failed to submit review.");
                showNotification({
                    type: "error",
                    message: result?.message || "Failed to submit review."
                });
            }
        }
    };

    const handleStartEdit = (review) => {
        setEditingReview(review);
        setValue("rating", Number(review.rating), { shouldValidate: true });
        setValue("comment", review.comment || "", { shouldValidate: true });
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

        const result = await dispatch(deleteProductReview(reviewId));
        if (result?.success) {
            showNotification({
                type: "success",
                message: "Review removed successfully."
            });
            dispatch(getProductReviews(productId));
            if (onReviewAdded) onReviewAdded();
        } else {
            showNotification({
                type: "error",
                message: result?.message || "Failed to remove review."
            });
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

                    <form onSubmit={handleSubmit(onSubmitReview)} className="review-form" noValidate>
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
                                        onClick={() => setValue("rating", star, { shouldValidate: true })}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="rating-num-label">({rating} of 5 Stars)</span>
                            </div>
                            {errors.rating && (
                                <p className="field-error" style={{ color: "#f87171", fontSize: "0.78rem", marginTop: "4px" }}>
                                    {errors.rating.message}
                                </p>
                            )}
                        </div>

                        <label>
                            Your review
                            <textarea
                                rows={3}
                                {...register("comment")}
                                placeholder="Share your experience with this watch (at least 10 characters)"
                            />
                            {errors.comment && (
                                <p className="field-error" style={{ color: "#f87171", fontSize: "0.78rem", marginTop: "4px" }}>
                                    {errors.comment.message}
                                </p>
                            )}
                        </label>

                        <button
                            type="submit"
                            className="gold-button submit-review-btn"
                            disabled={submitting}
                        >
                            {submitting ? "Submitting…" : editingReview ? "Update review" : "Submit review"}
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
