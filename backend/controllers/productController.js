const mongoose = require("mongoose");
const Product = require("../models/product");
const User = require("../models/user");
const Order = require("../models/order");
const cloudinary = require("../config/cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getProducts = catchAsyncErrors(async (req, res) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 12;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    const filter = { isActive: true };

    const {
        keyword,
        brand,
        category,
        movement,
        condition,
        minPrice,
        maxPrice,
        minRating,
        minReviews
    } = req.query;

    if (keyword && typeof keyword === "string") {
        const safeKeyword = escapeRegex(keyword.trim());
        filter.$or = [
            { name: { $regex: safeKeyword, $options: "i" } },
            { brand: { $regex: safeKeyword, $options: "i" } },
            { description: { $regex: safeKeyword, $options: "i" } }
        ];
    }

    if (brand) {
        filter.brand = String(brand).trim();
    }

    if (category) {
        filter.category = String(category).trim().toLowerCase();
    }

    if (movement) {
        filter.movement = String(movement).trim().toLowerCase();
    }

    if (condition) {
        filter.condition = String(condition).trim().toLowerCase();
    }

    const priceFilter = {};
    if (Number.isFinite(Number(minPrice))) {
        priceFilter.$gte = Number(minPrice);
    }
    if (Number.isFinite(Number(maxPrice))) {
        priceFilter.$lte = Number(maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
        filter.price = priceFilter;
    }

    if (Number.isFinite(Number(minRating))) {
        filter.ratings = { $gte: Number(minRating) };
    }

    if (Number.isFinite(Number(minReviews))) {
        filter.numOfReviews = { $gte: Number(minReviews) };
    }

    const skip = (page - 1) * limit;

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

    if (Array.isArray(req.body.images) && req.body.images.length > 0) {
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

// Admin: Delete product (soft delete if in orders)
const deleteProduct = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid product ID", 400));
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product not found", 404));
    }

    // Check if product exists in any completed/existing orders
    const hasOrders = await Order.findOne({ "orderItems.product": req.params.id });

    if (hasOrders) {
        product.isActive = false;
        await product.save({ validateBeforeSave: false });
        return res.status(200).json({
            success: true,
            message: "Product exists in existing orders; marked as inactive instead of deleting."
        });
    }

    // Also remove from any user's wishlist
    await User.updateMany(
        { wishlist: req.params.id },
        { $pull: { wishlist: req.params.id } }
    );

    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
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
    getWishlist,
    addToWishlist,
    removeFromWishlist
};