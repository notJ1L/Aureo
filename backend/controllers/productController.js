const mongoose = require("mongoose");

const Product = require("../models/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const getProducts = catchAsyncErrors(async (req, res) => {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit =
        Number.parseInt(req.query.limit, 10) || 12;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    const filter = {
        isActive: true
    };

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
        filter.ratings = {
            $gte: Number(minRating)
        };
    }

    if (Number.isFinite(Number(minReviews))) {
        filter.numOfReviews = {
            $gte: Number(minReviews)
        };
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

const getProduct = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(
            new ErrorHandler("Invalid product ID", 400)
        );
    }

    const product = await Product.findOne({
        _id: req.params.id,
        isActive: true
    });

    if (!product) {
        return next(
            new ErrorHandler("Product not found", 404)
        );
    }

    res.status(200).json({
        success: true,
        product
    });
});

module.exports = {
    getProducts,
    getProduct
};