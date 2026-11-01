const mongoose = require("mongoose");
const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const cloudinary = require("../config/cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const { buildProductFilter, buildPagination } = require("../utils/apiFeatures");

const getProducts = catchAsyncErrors(async (req, res) => {
    const { page, limit, skip } = buildPagination(req.query);

    const filter = buildProductFilter(req.query);

    const [products, totalProducts] = await Promise.all([
        Product.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Product.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        products,
        pagination: {
            page,
            limit,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit)
        }
    });
});

// Public: Get single product by ID
const getProduct = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findOne({
        _id: req.params.id,
        isActive: true
    });

    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    res.status(200).json({
        success: true,
        product
    });
});

// Admin: Get all products (active and inactive)
const getAdminProducts = catchAsyncErrors(async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        products,
        total: products.length
    });
});

// Admin: Create new product (FR 2.1 & FR 2.2)
const createProduct = catchAsyncErrors(async (req, res, next) => {
    const {
        name,
        brand,
        category,
        movement,
        caseSize,
        condition,
        price,
        description,
        stock,
        images
    } = req.body;

    if (condition === "second-hand" && Number(stock) !== 1) {
        return next(
            new ErrorHandler("Second-hand products must have a stock of exactly 1", 400)
        );
    }

    const uploadedImages = [];

    if (Array.isArray(images) && images.length > 0) {
        for (const img of images) {
            if (typeof img === "string" && img.startsWith("data:image")) {
                const result = await cloudinary.uploader.upload(img, {
                    folder: "aureo/products",
                    crop: "limit",
                    width: 1200
                });
                uploadedImages.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            } else if (img && img.url) {
                uploadedImages.push(img);
            }
        }
    }

    const product = await Product.create({
        name,
        brand,
        category: category || "luxury",
        movement,
        caseSize,
        condition,
        price,
        description,
        stock: condition === "second-hand" ? 1 : Number(stock) || 0,
        images: uploadedImages
    });

    res.status(201).json({
        success: true,
        product
    });
});

// Admin: Update product
const updateProduct = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    let product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const targetCondition = req.body.condition || product.condition;
    const targetStock = req.body.stock !== undefined ? Number(req.body.stock) : product.stock;

    if (targetCondition === "second-hand" && ![0, 1].includes(targetStock)) {
        return next(
            new ErrorHandler("Second-hand products can only have 0 or 1 unit in stock", 400)
        );
    }

    if (Array.isArray(req.body.images)) {
        const newImages = [];
        for (const img of req.body.images) {
            if (typeof img === "string" && img.startsWith("data:image")) {
                const result = await cloudinary.uploader.upload(img, {
                    folder: "aureo/products",
                    crop: "limit",
                    width: 1200
                });
                newImages.push({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            } else if (img && img.url) {
                newImages.push(img);
            }
        }

        // Clean up removed Cloudinary images if they were deleted by the admin
        if (product.images && product.images.length > 0) {
            const keptPublicIds = new Set(newImages.map((i) => i.public_id).filter(Boolean));
            for (const oldImg of product.images) {
                if (oldImg.public_id && !keptPublicIds.has(oldImg.public_id)) {
                    try {
                        await cloudinary.uploader.destroy(oldImg.public_id);
                    } catch (err) {
                        // ignore cloudinary deletion error
                    }
                }
            }
        }

        req.body.images = newImages;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        product
    });
});

// Admin: Delete product (Strictly soft delete - no hard delete)
const deleteProduct = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Strictly soft delete: mark isActive = false
    product.isActive = false;
    await product.save({ validateBeforeSave: false });

    // Also remove from any user's active wishlist
    await User.updateMany(
        { wishlist: req.params.id },
        { $pull: { wishlist: req.params.id } }
    );

    res.status(200).json({
        success: true,
        message: "Product deactivated (soft deleted) successfully"
    });
});

// Admin: Bulk delete products (Strictly soft delete - no hard delete)
const bulkDeleteProducts = catchAsyncErrors(async (req, res, next) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return next(
            new ErrorHandler("Provide at least one product id to delete", 400)
        );
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const skipped = ids.length - validIds.length;

    if (validIds.length === 0) {
        return next(new ErrorHandler("No valid product ids were provided", 400));
    }

    const result = await Product.updateMany(
        { _id: { $in: validIds } },
        { isActive: false }
    );

    // Also remove from wishlists
    await User.updateMany(
        { wishlist: { $in: validIds } },
        { $pull: { wishlist: { $in: validIds } } }
    );

    res.status(200).json({
        success: true,
        message: `Bulk deactivation complete. ${result.modifiedCount} product(s) marked as inactive (soft deleted).`,
        deleted: result.modifiedCount,
        skipped
    });
});

// Admin: Bulk update product active/archived status
const bulkUpdateProductStatus = catchAsyncErrors(async (req, res, next) => {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return next(
            new ErrorHandler("Provide at least one product ID", 400)
        );
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
        return next(new ErrorHandler("No valid product IDs provided", 400));
    }

    const targetStatus = Boolean(isActive);

    await Product.updateMany(
        { _id: { $in: validIds } },
        { $set: { isActive: targetStatus } }
    );

    res.status(200).json({
        success: true,
        message: `${validIds.length} timepiece(s) ${targetStatus ? "restored to active catalog" : "archived"}.`,
        updatedCount: validIds.length
    });
});

// User: Get Wishlist (FR 2.4)
const getWishlist = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
        path: "wishlist",
        select: "name brand price condition stock images ratings numOfReviews isActive"
    });

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        wishlist: user.wishlist || []
    });
});

// User: Add product to Wishlist
const addToWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { wishlist: productId } },
        { new: true }
    ).populate({
        path: "wishlist",
        select: "name brand price condition stock images ratings numOfReviews isActive"
    });

    res.status(200).json({
        success: true,
        message: "Added to wishlist",
        wishlist: user.wishlist
    });
});

// User: Remove product from Wishlist
const removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { wishlist: productId } },
        { new: true }
    ).populate({
        path: "wishlist",
        select: "name brand price condition stock images ratings numOfReviews isActive"
    });

    res.status(200).json({
        success: true,
        message: "Removed from wishlist",
        wishlist: user.wishlist
    });
});

module.exports = {
    getProducts,
    getProduct,
    getAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkDeleteProducts,
    bulkUpdateProductStatus,
    getWishlist,
    addToWishlist,
    removeFromWishlist
};