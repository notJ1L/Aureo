const express = require("express");

const {
    getProductReviews,
    createOrUpdateReview,
    updateReview,
    deleteReview
} = require("../controllers/reviewController");

const {
    isAuthenticatedUser,
    requireVerified
} = require("../middlewares/auth");

const router = express.Router();

router.get("/product/:id/reviews", getProductReviews);
router.post("/product/:id/review", isAuthenticatedUser, requireVerified, createOrUpdateReview);
router.put("/review/:id", isAuthenticatedUser, updateReview);
router.delete("/review/:id", isAuthenticatedUser, deleteReview);

module.exports = router;
