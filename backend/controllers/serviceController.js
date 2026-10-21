const mongoose = require("mongoose");
const Service = require("../models/service");
const Ticket = require("../models/ticket");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");

// FR 5.1: everybody can see the services.
const getServices = catchAsyncErrors(async (req, res) => {
    const services = await Service.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: services.length,
        services
    });
});

const getService = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid service ID", 400));
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
        return next(new ErrorHandler("Service not found", 404));
    }

    res.status(200).json({
        success: true,
        service
    });
});

// FR 5.1: only an admin creates a service.
const createService = catchAsyncErrors(async (req, res, next) => {
    const { name, description, price } = req.body;

    if (!name || !description || price === undefined) {
        return next(
            new ErrorHandler("Name, description and price are required", 400)
        );
    }

    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return next(
            new ErrorHandler("The service price must be a positive number", 400)
        );
    }

    const service = await Service.create({
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice
    });

    res.status(201).json({
        success: true,
        service
    });
});

const updateService = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid service ID", 400));
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
        return next(new ErrorHandler("Service not found", 404));
    }

    const updates = {};

    if (req.body.name !== undefined) {
        updates.name = String(req.body.name).trim();

        if (!updates.name) {
            return next(new ErrorHandler("The service name is required", 400));
        }
    }

    if (req.body.description !== undefined) {
        updates.description = String(req.body.description).trim();

        if (!updates.description) {
            return next(
                new ErrorHandler("The service description is required", 400)
            );
        }
    }

    if (req.body.price !== undefined) {
        const parsedPrice = Number(req.body.price);

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            return next(
                new ErrorHandler("The service price must be a positive number", 400)
            );
        }

        updates.price = parsedPrice;
    }

    Object.assign(service, updates);
    await service.save();

    res.status(200).json({
        success: true,
        service
    });
});

const deleteService = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid service ID", 400));
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
        return next(new ErrorHandler("Service not found", 404));
    }

    // A service that already has tickets keeps its history, it is only hidden
    // from the public list.
    const hasTickets = await Ticket.findOne({ service: service._id });

    if (hasTickets) {
        await service.deleteOne();

        return res.status(200).json({
            success: true,
            message:
                "Service removed. Its existing tickets keep their record.",
            service
        });
    }

    await service.deleteOne();

    res.status(200).json({
        success: true,
        message: "Service removed.",
        service
    });
});

// MP1: the service datatable offers a checkbox bulk delete.
const bulkDeleteServices = catchAsyncErrors(async (req, res, next) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return next(
            new ErrorHandler("Provide at least one service id to delete", 400)
        );
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const skipped = ids.length - validIds.length;

    if (validIds.length === 0) {
        return next(new ErrorHandler("No valid service ids were provided", 400));
    }

    const deleted = await Service.deleteMany({ _id: { $in: validIds } });

    res.status(200).json({
        success: true,
        message: `Bulk delete complete. ${deleted.deletedCount} service(s) removed.`,
        deleted: deleted.deletedCount,
        skipped
    });
});

module.exports = {
    getServices,
    getService,
    createService,
    updateService,
    deleteService,
    bulkDeleteServices
};
