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
            .sort({ createdAt: -1, _id: -1 })
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
    const products = await Product.find().sort({ createdAt: -1, _id: -1 });

    res.status(200).json({
        success: true,
        products,
        total: products.length
    });
});

// Admin: Create new product (FR 2.1 & FR 2.2) inside a transaction
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

    let uploadedImages = [];

    if (Array.isArray(images) && images.length > 0) {
        const uploadPromises = images.map(async (img) => {
            if (typeof img === "string" && img.startsWith("data:image")) {
                const result = await cloudinary.uploader.upload(img, {
                    folder: "aureo/products",
                    crop: "limit",
                    width: 1400
                });
                return {
                    public_id: result.public_id,
                    url: result.secure_url
                };
            } else if (img && img.url) {
                return img;
            }
            return null;
        });

        const uploadResults = await Promise.all(uploadPromises);
        uploadedImages = uploadResults.filter(Boolean);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let product;
    try {
        const [createdProduct] = await Product.create(
            [
                {
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
                }
            ],
            { session }
        );
        product = createdProduct;

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    res.status(201).json({
        success: true,
        product
    });
});

// Admin: Update product inside a transaction
const updateProduct = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let product;
    try {
        product = await Product.findById(req.params.id).session(session);
        if (!product) {
            await session.abortTransaction();
            return next(new ErrorHandler("Product not found", 404));
        }

        const targetCondition = req.body.condition || product.condition;
        const targetStock = req.body.stock !== undefined ? Number(req.body.stock) : product.stock;

        if (targetCondition === "second-hand" && ![0, 1].includes(targetStock)) {
            await session.abortTransaction();
            return next(
                new ErrorHandler("Second-hand products can only have 0 or 1 unit in stock", 400)
            );
        }

        if (Array.isArray(req.body.images)) {
            const uploadPromises = req.body.images.map(async (img) => {
                if (typeof img === "string" && img.startsWith("data:image")) {
                    const result = await cloudinary.uploader.upload(img, {
                        folder: "aureo/products",
                        crop: "limit",
                        width: 1400
                    });
                    return {
                        public_id: result.public_id,
                        url: result.secure_url
                    };
                } else if (img && img.url) {
                    return img;
                }
                return null;
            });

            const resolvedResults = await Promise.all(uploadPromises);
            const newImages = resolvedResults.filter(Boolean);

            if (product.images && product.images.length > 0) {
                const keptPublicIds = new Set(newImages.map((i) => i.public_id).filter(Boolean));
                const deletePromises = product.images
                    .filter((oldImg) => oldImg.public_id && !keptPublicIds.has(oldImg.public_id))
                    .map((oldImg) => cloudinary.uploader.destroy(oldImg.public_id).catch(() => {}));

                await Promise.allSettled(deletePromises);
            }

            req.body.images = newImages;
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: "after",
            runValidators: true,
            session
        });

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
        product
    });
});

// Admin: Delete product (Strictly soft delete - no hard delete) inside a transaction
const deleteProduct = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const product = await Product.findById(req.params.id).session(session);
        if (!product) {
            await session.abortTransaction();
            return next(new ErrorHandler("Product not found", 404));
        }

        product.isActive = false;
        await product.save({ session, validateBeforeSave: false });

        // Also remove from any user's active wishlist atomically
        await User.updateMany(
            { wishlist: req.params.id },
            { $pull: { wishlist: req.params.id } },
            { session }
        );

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
        message: "Product deactivated (soft deleted) successfully"
    });
});

// Admin: Permanently delete an archived product inside a transaction
const permanentlyDeleteProduct = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let imageIds = [];
    try {
        const product = await Product.findById(req.params.id).session(session);
        if (!product) {
            await session.abortTransaction();
            return next(new ErrorHandler("Product not found", 404));
        }

        if (product.isActive !== false) {
            await session.abortTransaction();
            return next(new ErrorHandler("Only archived products can be permanently deleted", 400));
        }

        imageIds = (product.images || []).map((image) => image.public_id).filter(Boolean);

        await User.updateMany(
            { wishlist: req.params.id },
            { $pull: { wishlist: req.params.id } },
            { session }
        );
        await Product.deleteOne({ _id: product._id }).session(session);

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    if (imageIds.length > 0) {
        await Promise.all(imageIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
    }

    res.status(200).json({
        success: true,
        message: "Product permanently deleted"
    });
});

// Admin: Bulk delete products (permanently delete products not referenced by orders, deactivate those with orders) inside a transaction
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

    const session = await mongoose.startSession();
    session.startTransaction();

    let deleted = 0;
    let deactivated = 0;
    let imageIds = [];

    try {
        const products = await Product.find({ _id: { $in: validIds } }).session(session);

        if (products.length === 0) {
            await session.abortTransaction();
            return res.status(200).json({
                success: true,
                message: "No matching products found to delete.",
                deleted: 0,
                deactivated: 0,
                skipped
            });
        }

        // Identify which products have historic orders so we don't break order history
        const productsWithOrders = await Order.distinct("orderItems.product", {
            "orderItems.product": { $in: validIds }
        }).session(session);

        const orderProductSet = new Set(productsWithOrders.map((id) => id.toString()));

        const deletableProducts = [];
        const deactivatableIds = [];

        for (const product of products) {
            if (orderProductSet.has(product._id.toString())) {
                deactivatableIds.push(product._id);
            } else {
                deletableProducts.push(product);
            }
        }

        if (deactivatableIds.length > 0) {
            await Product.updateMany(
                { _id: { $in: deactivatableIds } },
                { $set: { isActive: false } },
                { session }
            );
            deactivated = deactivatableIds.length;
        }

        if (deletableProducts.length > 0) {
            const deletableIds = deletableProducts.map((p) => p._id);

            for (const p of deletableProducts) {
                if (Array.isArray(p.images)) {
                    for (const img of p.images) {
                        if (img && img.public_id) {
                            imageIds.push(img.public_id);
                        }
                    }
                }
            }

            await Product.deleteMany({ _id: { $in: deletableIds } }, { session });
            deleted = deletableIds.length;
        }

        await User.updateMany(
            { wishlist: { $in: validIds } },
            { $pull: { wishlist: { $in: validIds } } },
            { session }
        );

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    if (imageIds.length > 0) {
        await Promise.allSettled(
            imageIds.map((publicId) => cloudinary.uploader.destroy(publicId))
        );
    }

    let message = `${deleted} timepiece(s) permanently deleted.`;
    if (deactivated > 0) {
        message = `${deleted} timepiece(s) permanently deleted, ${deactivated} kept archived (linked to existing orders).`;
    }

    res.status(200).json({
        success: true,
        message,
        deleted,
        deactivated,
        skipped
    });
});

// Admin: Bulk update product active/archived status inside a transaction
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await Product.updateMany(
            { _id: { $in: validIds } },
            { $set: { isActive: targetStatus } },
            { session }
        );

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

// User: Add product to Wishlist inside a transaction
const addToWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    try {
        const product = await Product.findById(productId).session(session);
        if (!product) {
            await session.abortTransaction();
            return next(new ErrorHandler("Product not found", 404));
        }

        user = await User.findByIdAndUpdate(
            req.user._id,
            { $addToSet: { wishlist: productId } },
            { returnDocument: "after", session }
        ).populate({
            path: "wishlist",
            select: "name brand price condition stock images ratings numOfReviews isActive"
        });

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
        message: "Added to wishlist",
        wishlist: user.wishlist
    });
});

// User: Remove product from Wishlist inside a transaction
const removeFromWishlist = catchAsyncErrors(async (req, res, next) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    try {
        user = await User.findByIdAndUpdate(
            req.user._id,
            { $pull: { wishlist: productId } },
            { returnDocument: "after", session }
        ).populate({
            path: "wishlist",
            select: "name brand price condition stock images ratings numOfReviews isActive"
        });

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
    permanentlyDeleteProduct,
    bulkDeleteProducts,
    bulkUpdateProductStatus,
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
