const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Review = require("../models/review");
const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const { cleanText } = require("../utils/filterBadWords");

// Helper to update product ratings (active reviews only), optionally inside a transaction session
const updateProductRatingStats = async (productId, session = null) => {
    const query = Review.find({ product: productId, isActive: true });
    if (session) {
        query.session(session);
    }
    const reviews = await query;
    const numOfReviews = reviews.length;
    const ratings =
        numOfReviews > 0
            ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / numOfReviews).toFixed(1))
            : 0;

    await Product.findByIdAndUpdate(
        productId,
        {
            ratings,
            numOfReviews
        },
        session ? { session } : {}
    );
};

// Public: Get all active reviews for a product (plus review eligibility if signed in)
const getProductReviews = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const reviews = await Review.find({ product: id, isActive: true })
        .populate("user", "name avatar")
        .sort({ createdAt: -1 });

    let canReview = false;
    let purchaseStatus = null;
    let ineligibleReason =
        "Only collectors who have purchased and received this timepiece can leave a review.";

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (user) {
                    const userOrders = await Order.find({
                        user: user._id,
                        "orderItems.product": id
                    }).sort({ createdAt: -1 });

                    const deliveredOrder = userOrders.find((o) => o.status === "Completed");
                    const inProgressOrder = userOrders.find((o) =>
                        ["Pending", "Paid", "Shipped"].includes(o.status)
                    );

                    if (deliveredOrder) {
                        canReview = true;
                        purchaseStatus = "Completed";
                        ineligibleReason = null;
                    } else if (inProgressOrder) {
                        canReview = false;
                        purchaseStatus = inProgressOrder.status;
                        ineligibleReason = `Your order for this timepiece is currently "${inProgressOrder.status}". You will be able to leave a review once it has been delivered (Completed).`;
                    }
                }
            } catch (err) {
                // Ignore invalid/expired token on public endpoint
            }
        }
    }

    res.status(200).json({
        success: true,
        count: reviews.length,
        reviews,
        canReview,
        purchaseStatus,
        ineligibleReason
    });
});

// Verified purchaser: Create or update review for product (using a MongoDB ACID transaction)
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

    // Verify user has purchased this product AND it has been delivered (Completed)
    const deliveredOrder = await Order.findOne({
        user: req.user._id,
        "orderItems.product": id,
        status: "Completed"
    });

    if (!deliveredOrder) {
        const undeliveredOrder = await Order.findOne({
            user: req.user._id,
            "orderItems.product": id,
            status: { $in: ["Pending", "Paid", "Shipped"] }
        }).sort({ createdAt: -1 });

        if (undeliveredOrder) {
            return next(
                new ErrorHandler(
                    `You cannot review this timepiece yet because your order has not been delivered (current status: ${undeliveredOrder.status}).`,
                    403
                )
            );
        }

        return next(
            new ErrorHandler(
                "Only verified collectors who have purchased and received this timepiece may leave a review.",
                403
            )
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

    const session = await mongoose.startSession();
    session.startTransaction();

    let review;
    try {
        // Check if review already exists. A soft deleted review is reused so the
        // unique (user, product) index is never violated by a second posting.
        review = await Review.findOne({
            user: req.user._id,
            product: id
        }).session(session);

        if (review) {
            review.rating = Number(rating);
            review.comment = safeComment;
            review.isActive = true;
            await review.save({ session });
        } else {
            const created = await Review.create(
                [
                    {
                        user: req.user._id,
                        product: id,
                        rating: Number(rating),
                        comment: safeComment
                    }
                ],
                { session }
            );
            review = created[0];
        }

        // Recalculate average rating & review count inside the same transaction
        await updateProductRatingStats(id, session);

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "Review saved successfully",
        review
    });
});

// Owner only: update an existing review inside a MongoDB transaction. FR 6.1 / MP3.
const updateReview = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid review ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let review;
    try {
        review = await Review.findById(id).session(session);

        if (!review || !review.isActive) {
            await session.abortTransaction();
            return next(new ErrorHandler("Review not found", 404));
        }

        const isOwner = review.user.toString() === req.user._id.toString();

        if (!isOwner) {
            await session.abortTransaction();
            return next(
                new ErrorHandler("You are not authorized to edit this review", 403)
            );
        }

        if (rating !== undefined) {
            const parsedRating = Number(rating);

            if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler("Rating must be a whole number between 1 and 5", 400)
                );
            }

            review.rating = parsedRating;
        }

        if (comment !== undefined) {
            if (!comment || !comment.trim()) {
                await session.abortTransaction();
                return next(new ErrorHandler("Review comment cannot be empty", 400));
            }

            review.comment = cleanText(comment.trim());
        }

        await review.save({ session });
        await updateProductRatingStats(review.product, session);

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "Review updated successfully",
        review
    });
});

// Delete review: Owner or Admin (soft delete + rating recalculation inside a transaction)
const deleteReview = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid review ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const review = await Review.findById(id).session(session);
        if (!review) {
            await session.abortTransaction();
            return next(new ErrorHandler("Review not found", 404));
        }

        const isOwner = review.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            await session.abortTransaction();
            return next(new ErrorHandler("You are not authorized to delete this review", 403));
        }

        const productId = review.product;

        // Soft delete: set isActive to false
        review.isActive = false;
        await review.save({ session });

        // Recalculate product ratings inside the transaction
        await updateProductRatingStats(productId, session);

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "Review removed (soft deleted) successfully"
    });
});

// Admin: Get all reviews across all products (with optional filtering)
const getAdminReviews = catchAsyncErrors(async (req, res) => {
    const { status, rating, productId } = req.query;
    const filter = {};

    if (status === "active") {
        filter.isActive = true;
    } else if (status === "deleted") {
        filter.isActive = false;
    }

    if (rating) {
        filter.rating = Number(rating);
    }

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        filter.product = productId;
    }

    const reviews = await Review.find(filter)
        .populate("user", "name email avatar")
        .populate("product", "name brand price images")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: reviews.length,
        reviews
    });
});

// Admin: Restore a soft-deleted review
const restoreReview = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid review ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let review;
    try {
        review = await Review.findById(id).session(session);
        if (!review) {
            await session.abortTransaction();
            return next(new ErrorHandler("Review not found", 404));
        }

        review.isActive = true;
        await review.save({ session });

        await updateProductRatingStats(review.product, session);
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "Review restored successfully",
        review
    });
});

// Admin: Bulk delete / restore reviews
const bulkReviewAction = catchAsyncErrors(async (req, res, next) => {
    const { reviewIds, action } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
        return next(new ErrorHandler("Please provide an array of review IDs", 400));
    }

    const validIds = reviewIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
        return next(new ErrorHandler("No valid review IDs provided", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const targetStatus = action === "restore";
        const reviewsToUpdate = await Review.find({ _id: { $in: validIds } }).session(session);

        await Review.updateMany(
            { _id: { $in: validIds } },
            { $set: { isActive: targetStatus } },
            { session }
        );

        // Recalculate unique product ratings
        const affectedProductIds = [...new Set(reviewsToUpdate.map((r) => r.product.toString()))];
        for (const pId of affectedProductIds) {
            await updateProductRatingStats(pId, session);
        }

        await session.commitTransaction();

        res.status(200).json({
            success: true,
            message: `Successfully ${action === "restore" ? "restored" : "deleted"} ${validIds.length} review(s)`
        });
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }
});

// Admin: Permanent delete review
const permanentlyDeleteReview = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid review ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const review = await Review.findById(id).session(session);
        if (!review) {
            await session.abortTransaction();
            return next(new ErrorHandler("Review not found", 404));
        }

        const productId = review.product;
        await Review.findByIdAndDelete(id).session(session);

        await updateProductRatingStats(productId, session);
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "Review permanently deleted"
    });
});

module.exports = {
    getProductReviews,
    getAdminReviews,
    createOrUpdateReview,
    updateReview,
    deleteReview,
    restoreReview,
    bulkReviewAction,
    permanentlyDeleteReview
};
