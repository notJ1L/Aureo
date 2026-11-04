import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AdminHeader } from "../../components/layout/AdminHeader";
import {
    IconStar,
    IconTrash,
    IconSearch,
    IconAlert
} from "../../components/layout/icons";
import { showSuccess, showError, confirmAction } from "../../utils/sweetAlert";
import { showNotification } from "../../utils/notification";
import "../../styles/admin.css";

function AdminReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    // Edit modal state
    const [editingReview, setEditingReview] = useState(null);
    const [editRating, setEditRating] = useState(5);
    const [editComment, setEditComment] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (ratingFilter !== "all") params.rating = ratingFilter;

            const { data } = await api.get("/admin/reviews", { params });
            setReviews(data.reviews || []);
            setSelectedIds([]);
        } catch (err) {
            showError(err.response?.data?.message || "Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [statusFilter, ratingFilter]);

    const handleSoftDelete = async (review) => {
        const confirmed = await confirmAction({
            title: "Soft Delete Review",
            message: `Are you sure you want to deactivate this review by ${review.user?.name || "Collector"}?`,
            confirmText: "Deactivate",
            danger: true
        });
        if (!confirmed) return;

        try {
            await api.delete(`/review/${review._id}`);
            showSuccess("Review soft deleted successfully");
            fetchReviews();
        } catch (err) {
            showError(err.response?.data?.message || "Failed to deactivate review");
        }
    };

    const handleRestore = async (review) => {
        try {
            await api.put(`/admin/review/${review._id}/restore`);
            showSuccess("Review restored successfully");
            fetchReviews();
        } catch (err) {
            showError(err.response?.data?.message || "Failed to restore review");
        }
    };

    const handlePermanentDelete = async (review) => {
        const confirmed = await confirmAction({
            title: "Permanent Delete",
            message: "This action cannot be undone. Are you sure you want to permanently delete this review?",
            confirmText: "Delete Permanently",
            danger: true
        });
        if (!confirmed) return;

        try {
            await api.delete(`/admin/review/${review._id}/permanent`);
            showSuccess("Review permanently deleted");
            fetchReviews();
        } catch (err) {
            showError(err.response?.data?.message || "Failed to permanently delete review");
        }
    };

    const openEditModal = (review) => {
        setEditingReview(review);
        setEditRating(review.rating);
        setEditComment(review.comment);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editComment.trim()) {
            showNotification({ type: "error", message: "Review comment cannot be empty." });
            return;
        }

        try {
            setEditLoading(true);
            await api.put(`/review/${editingReview._id}`, {
                rating: editRating,
                comment: editComment
            });
            showSuccess("Review updated successfully");
            setEditingReview(null);
            fetchReviews();
        } catch (err) {
            showError(err.response?.data?.message || "Failed to update review");
        } finally {
            setEditLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredReviews.map((r) => r._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleBulkAction = async (action) => {
        if (selectedIds.length === 0) return;

        const actionText = action === "restore" ? "restore" : "deactivate";
        const confirmed = await confirmAction({
            title: `Bulk ${action === "restore" ? "Restore" : "Delete"}`,
            message: `Are you sure you want to ${actionText} ${selectedIds.length} review(s)?`,
            confirmText: action === "restore" ? "Restore" : "Deactivate",
            danger: action !== "restore"
        });
        if (!confirmed) return;

        try {
            setBulkLoading(true);
            await api.post("/admin/reviews/bulk", {
                reviewIds: selectedIds,
                action
            });
            showSuccess(`Successfully ${actionText}d ${selectedIds.length} review(s)`);
            fetchReviews();
        } catch (err) {
            showError(err.response?.data?.message || "Bulk action failed");
        } finally {
            setBulkLoading(false);
        }
    };

    const filteredReviews = reviews.filter((rev) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const userName = rev.user?.name?.toLowerCase() || "";
        const userEmail = rev.user?.email?.toLowerCase() || "";
        const prodName = rev.product?.name?.toLowerCase() || "";
        const comment = rev.comment?.toLowerCase() || "";
        return userName.includes(q) || userEmail.includes(q) || prodName.includes(q) || comment.includes(q);
    });

    const activeCount = reviews.filter((r) => r.isActive).length;
    const deletedCount = reviews.filter((r) => !r.isActive).length;

    return (
        <div className="admin-page page-enter">
            <AdminHeader />

            <div className="admin-container admin-container--wide">
                <div className="admin-page-title-row">
                    <div>
                        <p className="eyebrow">HOROLOGY VAULT</p>
                        <h1>Product Reviews Management</h1>
                    </div>
                </div>

                <div className="admin-filter-bar">
                    <div className="admin-status-tabs">
                        <button
                            type="button"
                            className={`admin-tab-btn ${statusFilter === "all" ? "is-active" : ""}`}
                            onClick={() => setStatusFilter("all")}
                        >
                            All Reviews <span className="admin-tab-count">{reviews.length}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${statusFilter === "active" ? "is-active" : ""}`}
                            onClick={() => setStatusFilter("active")}
                        >
                            Active <span className="admin-tab-count">{activeCount}</span>
                        </button>
                        <button
                            type="button"
                            className={`admin-tab-btn ${statusFilter === "deleted" ? "is-active" : ""}`}
                            onClick={() => setStatusFilter("deleted")}
                        >
                            Soft Deleted <span className="admin-tab-count">{deletedCount}</span>
                        </button>
                    </div>

                    <div className="admin-filter-group">
                        <div style={{ position: "relative", display: "inline-block" }}>
                            <input
                                type="text"
                                placeholder="Search collector, product or comment..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="catalog-input"
                                style={{ width: "280px", paddingLeft: "2.2rem" }}
                            />
                            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}>
                                <IconSearch />
                            </span>
                        </div>

                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            className="admin-filter-select"
                        >
                            <option value="all">All Ratings (1-5★)</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="admin-bulk-bar">
                        <span>{selectedIds.length} review(s) selected</span>
                        <button
                            type="button"
                            className="admin-btn edit-btn"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("restore")}
                        >
                            Restore Selected
                        </button>
                        <button
                            type="button"
                            className="admin-btn del-btn"
                            disabled={bulkLoading}
                            onClick={() => handleBulkAction("delete")}
                        >
                            Soft Delete Selected
                        </button>
                    </div>
                )}

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="admin-select-cell">
                                    <input
                                        type="checkbox"
                                        checked={
                                            filteredReviews.length > 0 &&
                                            selectedIds.length === filteredReviews.length
                                        }
                                        onChange={handleSelectAll}
                                        aria-label="Select all reviews"
                                    />
                                </th>
                                <th>Collector</th>
                                <th>Timepiece</th>
                                <th>Rating</th>
                                <th style={{ minWidth: "220px" }}>Comment</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "3rem" }}>
                                        Loading reviews...
                                    </td>
                                </tr>
                            ) : filteredReviews.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                                        No reviews found matching the selected filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredReviews.map((rev) => {
                                    const isSelected = selectedIds.includes(rev._id);
                                    return (
                                        <tr
                                            key={rev._id}
                                            className={isSelected ? "admin-row-selected" : ""}
                                        >
                                            <td className="admin-select-cell">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(rev._id)}
                                                    aria-label={`Select review by ${rev.user?.name}`}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                    <img
                                                        src={rev.user?.avatar?.url || "/default_avatar.png"}
                                                        alt=""
                                                        style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }}
                                                    />
                                                    <div>
                                                        <strong>{rev.user?.name || "Deleted User"}</strong>
                                                        <span className="admin-subtext">{rev.user?.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {rev.product ? (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                        {rev.product.images?.[0]?.url && (
                                                            <img
                                                                src={rev.product.images[0].url}
                                                                alt=""
                                                                style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover" }}
                                                            />
                                                        )}
                                                        <Link
                                                            to={`/product/${rev.product._id}`}
                                                            style={{ color: "var(--gold)", fontWeight: 500 }}
                                                            target="_blank"
                                                        >
                                                            {rev.product.name}
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "var(--text-muted)" }}>[Product Removed]</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "var(--gold)" }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} style={{ opacity: i < rev.rating ? 1 : 0.25 }}>
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span style={{ marginLeft: "4px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                                                        ({rev.rating}/5)
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                                {rev.comment}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        rev.isActive ? "verified-badge" : "unverified-badge"
                                                    }`}
                                                >
                                                    {rev.isActive ? "Active" : "Soft Deleted"}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                                {new Date(rev.createdAt).toLocaleDateString("en-PH", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric"
                                                })}
                                            </td>
                                            <td>
                                                <div className="admin-action-cell" style={{ justifyContent: "flex-end" }}>
                                                    <button
                                                        type="button"
                                                        className="admin-btn edit-btn"
                                                        onClick={() => openEditModal(rev)}
                                                        title="Edit Review Content"
                                                    >
                                                        Edit
                                                    </button>
                                                    {rev.isActive ? (
                                                        <button
                                                            type="button"
                                                            className="admin-btn del-btn"
                                                            onClick={() => handleSoftDelete(rev)}
                                                            title="Soft Delete (Deactivate)"
                                                        >
                                                            Delete
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="admin-btn restore-btn"
                                                            onClick={() => handleRestore(rev)}
                                                            title="Restore Review"
                                                        >
                                                            Restore
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="admin-btn del-btn"
                                                        style={{ borderColor: "rgba(229, 72, 77, 0.4)", color: "var(--danger-text)" }}
                                                        onClick={() => handlePermanentDelete(rev)}
                                                        title="Permanent Delete"
                                                    >
                                                        Purge
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Review Modal */}
            {editingReview && (
                <div className="modal-backdrop" onClick={() => setEditingReview(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-head">
                            <div>
                                <p className="eyebrow">HOROLOGY AUDIT</p>
                                <h2>Edit Collector Review</h2>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setEditingReview(null)}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="admin-form">
                            <label>
                                Collector
                                <input
                                    type="text"
                                    value={`${editingReview.user?.name || "Collector"} (${editingReview.user?.email || "n/a"})`}
                                    disabled
                                    style={{ opacity: 0.6 }}
                                />
                            </label>

                            <label>
                                Timepiece
                                <input
                                    type="text"
                                    value={editingReview.product?.name || "Product"}
                                    disabled
                                    style={{ opacity: 0.6 }}
                                />
                            </label>

                            <label>
                                Star Rating (1 - 5)
                                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", margin: "0.3rem 0" }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setEditRating(star)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: "1.6rem",
                                                cursor: "pointer",
                                                color: star <= editRating ? "var(--gold)" : "var(--text-muted)",
                                                padding: 0
                                            }}
                                        >
                                            ★
                                        </button>
                                    ))}
                                    <span style={{ marginLeft: "0.5rem", fontWeight: 600, color: "var(--gold)" }}>
                                        {editRating} / 5 Stars
                                    </span>
                                </div>
                            </label>

                            <label>
                                Review Comment
                                <textarea
                                    rows={5}
                                    value={editComment}
                                    onChange={(e) => setEditComment(e.target.value)}
                                    placeholder="Enter review comment..."
                                    required
                                />
                            </label>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="admin-btn edit-btn"
                                    onClick={() => setEditingReview(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="gold-button"
                                    disabled={editLoading}
                                >
                                    {editLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminReviewsPage;
