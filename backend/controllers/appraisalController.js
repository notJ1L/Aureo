const mongoose = require("mongoose");
const Appraisal = require("../models/appraisal");
const Product = require("../models/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const { uploadFiles } = require("../utils/cloudinaryUpload");
const { MAX_PHOTOS } = require("../utils/multer");

// FR 3.1: a verified user submits an appraisal for their own watch.
const createAppraisal = catchAsyncErrors(async (req, res, next) => {
    const {
        brand,
        model,
        movement,
        caseSize,
        condition,
        year,
        hasBox,
        hasPapers,
        askingPrice
    } = req.body;

    const files = req.files || [];

    if (files.length === 0) {
        return next(
            new ErrorHandler("At least one photo of the watch is required", 400)
        );
    }

    if (files.length > MAX_PHOTOS) {
        return next(
            new ErrorHandler(`You can upload a maximum of ${MAX_PHOTOS} photos`, 400)
        );
    }

    const photos = await uploadFiles(files, "aureo/appraisals");

    const appraisal = await Appraisal.create({
        user: req.user._id,
        brand,
        model,
        movement,
        caseSize: Number(caseSize),
        condition,
        year: Number(year),
        hasBox: hasBox === "true" || hasBox === true,
        hasPapers: hasPapers === "true" || hasPapers === true,
        askingPrice: Number(askingPrice),
        photos,
        status: "Pending"
    });

    res.status(201).json({
        success: true,
        message: "Appraisal submitted. Our team will review it shortly.",
        appraisal
    });
});

// FR 3.1: a user sees only their own appraisals.
const getMyAppraisals = catchAsyncErrors(async (req, res) => {
    const appraisals = await Appraisal.find({ user: req.user._id }).sort({
        createdAt: -1
    });

    res.status(200).json({
        success: true,
        count: appraisals.length,
        appraisals
    });
});

// FR 3.1: the detail view is limited to the owner and the admin.
const getAppraisal = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid appraisal ID", 400));
    }

    const appraisal = await Appraisal.findById(req.params.id)
        .populate("user", "name email avatar")
        .populate("convertedProduct", "name price stock condition");

    if (!appraisal) {
        return next(new ErrorHandler("Appraisal not found", 404));
    }

    const isOwner = appraisal.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return next(
            new ErrorHandler("You are not authorized to view this appraisal", 403)
        );
    }

    res.status(200).json({
        success: true,
        appraisal
    });
});

// FR 3.3: the user accepts or rejects the offer the admin made.
const respondToOffer = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid appraisal ID", 400));
    }

    const { decision } = req.body;

    if (!["Accepted", "Rejected"].includes(decision)) {
        return next(
            new ErrorHandler(
                'Decision must be either "Accepted" or "Rejected"',
                400
            )
        );
    }

    const appraisal = await Appraisal.findById(req.params.id);

    if (!appraisal) {
        return next(new ErrorHandler("Appraisal not found", 404));
    }

    if (appraisal.user.toString() !== req.user._id.toString()) {
        return next(
            new ErrorHandler("You can only respond to your own appraisal", 403)
        );
    }

    if (appraisal.status !== "Offer Made") {
        return next(
            new ErrorHandler(
                `This appraisal cannot be responded to while it is "${appraisal.status}".`,
                400
            )
        );
    }

    appraisal.status = decision;
    await appraisal.save();

    res.status(200).json({
        success: true,
        message: `Offer ${decision.toLowerCase()}.`,
        appraisal
    });
});

// FR 3.3: the admin reviews every appraisal.
const getAdminAppraisals = catchAsyncErrors(async (req, res) => {
    const appraisals = await Appraisal.find()
        .populate("user", "name email avatar")
        .populate("convertedProduct", "name price stock condition")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: appraisals.length,
        appraisals
    });
});

// FR 3.3: the admin makes an offer or rejects the appraisal.
const adminReviewAppraisal = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid appraisal ID", 400));
    }

    const { offerPrice, action } = req.body;

    const appraisal = await Appraisal.findById(req.params.id);

    if (!appraisal) {
        return next(new ErrorHandler("Appraisal not found", 404));
    }

    if (appraisal.status === "Accepted" || appraisal.status === "Rejected") {
        return next(
            new ErrorHandler(
                `This appraisal was already ${appraisal.status.toLowerCase()} and can no longer be reviewed.`,
                400
            )
        );
    }

    if (action === "reject") {
        appraisal.status = "Rejected";
        await appraisal.save();

        return res.status(200).json({
            success: true,
            message: "Appraisal rejected.",
            appraisal
        });
    }

    const price = Number(offerPrice);

    if (!Number.isFinite(price) || price < 0) {
        return next(
            new ErrorHandler("A valid offer price is required", 400)
        );
    }

    appraisal.offerPrice = price;
    appraisal.status = "Offer Made";
    await appraisal.save();

    res.status(200).json({
        success: true,
        message: `Offer of ${price} sent to the collector.`,
        appraisal
    });
});

// FR 3.3: an accepted appraisal becomes a second-hand product with a stock of
// exactly one. The conversion is idempotent.
const convertAppraisal = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid appraisal ID", 400));
    }

    const appraisal = await Appraisal.findById(req.params.id);

    if (!appraisal) {
        return next(new ErrorHandler("Appraisal not found", 404));
    }

    if (appraisal.convertedProduct) {
        return next(
            new ErrorHandler(
                "This appraisal was already converted into a listing.",
                409
            )
        );
    }

    if (appraisal.status !== "Accepted") {
        return next(
            new ErrorHandler(
                "Only an accepted appraisal can be converted into a listing.",
                400
            )
        );
    }

    const product = await Product.create({
        name: `${appraisal.brand} ${appraisal.model}`,
        brand: appraisal.brand,
        category: "pre-owned",
        movement: appraisal.movement,
        caseSize: appraisal.caseSize,
        condition: "second-hand",
        price: appraisal.offerPrice ?? appraisal.askingPrice,
        description: [
            `Pre-owned ${appraisal.brand} ${appraisal.model} from ${appraisal.year}.`,
            appraisal.hasBox ? "Original box included." : "",
            appraisal.hasPapers ? "Original papers included." : ""
        ]
            .filter(Boolean)
            .join(" "),
        images: appraisal.photos,
        // FR 2.2: a second-hand watch is a unique piece.
        stock: 1,
        isActive: true
    });

    appraisal.convertedProduct = product._id;
    await appraisal.save();

    res.status(201).json({
        success: true,
        message: "Appraisal converted into an active second-hand listing.",
        appraisal,
        product
    });
});

module.exports = {
    createAppraisal,
    getMyAppraisals,
    getAppraisal,
    respondToOffer,
    getAdminAppraisals,
    adminReviewAppraisal,
    convertAppraisal
};
