const mongoose = require("mongoose");
const Review = require("../models/review");
const Product = require("../models/product");
const Order = require("../models/order");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const { cleanText } = require("../utils/filterBadWords");

// Helper to update product ratings (active reviews only)
const updateProductRatingStats = async (productId) => {
    const reviews = await Review.find({ product: productId, isActive: true });
    const numOfReviews = reviews.length;
    const ratings = numOfReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / numOfReviews).toFixed(1))
        : 0;

    await Product.findByIdAndUpdate(productId, {
        ratings,
        numOfReviews
    });
};

// Public: Get all active reviews for a product
const getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const reviews = await Review.find({ product: id, isActive: true })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: reviews.length,
        reviews
    });
});

// Verified purchaser: Create or update review for product
const createOrUpdateReview = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findById(id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // FR 6.1: only brand new watches can be reviewed. A second-hand piece is
    // a unique item and is never reviewable.
    if (product.condition !== "new") {
        return next(
            new ErrorHandler(
                "Only brand new watches can be reviewed. Second-hand pieces cannot be reviewed.",
                400
            )
        );
    }

    // Verify user has purchased this product (status Paid, Shipped, or Completed)
    const hasPurchased = await Order.findOne({
        user: req.user._id,
        "orderItems.product": id,
        status: { $in: ["Paid", "Shipped", "Completed"] }
    });

    if (!hasPurchased && req.user.role !== "admin") {
        return next(
            new ErrorHandler("Only verified purchasers of this timepiece may leave a review.", 403)
        );
    }

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        return next(new ErrorHandler("Rating must be a whole number between 1 and 5", 400));
    }

    if (!comment || !comment.trim()) {
        return next(new ErrorHandler("Review comment cannot be empty", 400));
    }

    // Unit 1: mask profanity before the review is stored.
    const safeComment = cleanText(comment.trim());

    // Check if review already exists. A soft deleted review is reused so the
    // unique (user, product) index is never violated by a second posting.
    let review = await Review.findOne({
        user: req.user._id,
        product: id
    });

    if (review) {
        review.rating = Number(rating);
        review.comment = safeComment;
        review.isActive = true;
        await review.save();
    } else {
        review = await Review.create({
            user: req.user._id,
            product: id,
            rating: Number(rating),
            comment: safeComment
        });
    }

    // Recalculate average rating & review count
    await updateProductRatingStats(id);

    res.status(200).json({
        success: true,
        message: "Review saved successfully",
        review
    });
});

// Owner only: update an existing review. FR 6.1 / MP3.
const updateReview = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid review ID", 400));
    }

    const review = await Review.findById(id);

    if (!review || !review.isActive) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const isOwner = review.user.toString() === req.user._id.toString();

    if (!isOwner) {
        return next(
            new ErrorHandler("You are not authorized to edit this review", 403)
        );
    }

    if (rating !== undefined) {
        const parsedRating = Number(rating);

        if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
            return next(
                new ErrorHandler("Rating must be a whole number between 1 and 5", 400)
            );
        }

        review.rating = parsedRating;
    }

    if (comment !== undefined) {
        if (!comment || !comment.trim()) {
            return next(new ErrorHandler("Review comment cannot be empty", 400));
        }

        review.comment = cleanText(comment.trim());
    }

    await review.save();

    await updateProductRatingStats(review.product);

    res.status(200).json({
        success: true,
        message: "Review updated successfully",
        review
    });
});

// Delete review: Owner or Admin
const deleteReview = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid review ID", 400));
    }

    const review = await Review.findById(id);
    if (!review) {
        return next(new ErrorHandler("Review not found", 404));
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return next(new ErrorHandler("You are not authorized to delete this review", 403));
    }

    const productId = review.product;
    
    // Soft delete: set isActive to false
    review.isActive = false;
    await review.save();

    // Recalculate
    await updateProductRatingStats(productId);

    res.status(200).json({
        success: true,
        message: "Review removed (soft deleted) successfully"
    });
});

module.exports = {
    getProductReviews,
    createOrUpdateReview,
    updateReview,
    deleteReview
};
