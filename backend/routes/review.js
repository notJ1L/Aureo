const express = require("express");

const {
    getProductReviews,
    getAdminReviews,
    createOrUpdateReview,
    updateReview,
    deleteReview,
    restoreReview,
    bulkReviewAction,
    permanentlyDeleteReview
} = require("../controllers/reviewController");

const {
    isAuthenticatedUser,
    authorizeRoles,
    requireVerified
} = require("../middlewares/auth");

const router = express.Router();

router.get("/product/:id/reviews", getProductReviews);
router.post("/product/:id/review", isAuthenticatedUser, requireVerified, createOrUpdateReview);
router.put("/review/:id", isAuthenticatedUser, updateReview);
router.delete("/review/:id", isAuthenticatedUser, deleteReview);

// Admin review management endpoints
router.get("/admin/reviews", isAuthenticatedUser, authorizeRoles("admin"), getAdminReviews);
router.put("/admin/review/:id/restore", isAuthenticatedUser, authorizeRoles("admin"), restoreReview);
router.post("/admin/reviews/bulk", isAuthenticatedUser, authorizeRoles("admin"), bulkReviewAction);
router.delete("/admin/review/:id/permanent", isAuthenticatedUser, authorizeRoles("admin"), permanentlyDeleteReview);

module.exports = router;
