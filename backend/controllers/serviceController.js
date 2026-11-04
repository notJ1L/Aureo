const mongoose = require("mongoose");
const Service = require("../models/service");
const Ticket = require("../models/ticket");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");

// FR 5.1: Storefront visitors see active services; admins see all in directory
const getServices = catchAsyncErrors(async (req, res) => {
    const services = await Service.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: services.length,
        services
    });
});

const getAdminServices = catchAsyncErrors(async (req, res) => {
    const services = await Service.find({}).sort({ createdAt: -1 });

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

// FR 5.1: only an admin creates a service inside a transaction.
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

    const session = await mongoose.startSession();
    session.startTransaction();

    let service;
    try {
        const [createdService] = await Service.create(
            [
                {
                    name: name.trim(),
                    description: description.trim(),
                    price: parsedPrice
                }
            ],
            { session }
        );
        service = createdService;

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
        service
    });
});

const updateService = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid service ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let service;
    try {
        service = await Service.findById(req.params.id).session(session);

        if (!service) {
            await session.abortTransaction();
            return next(new ErrorHandler("Service not found", 404));
        }

        const updates = {};

        if (req.body.name !== undefined) {
            updates.name = String(req.body.name).trim();

            if (!updates.name) {
                await session.abortTransaction();
                return next(new ErrorHandler("The service name is required", 400));
            }
        }

        if (req.body.description !== undefined) {
            updates.description = String(req.body.description).trim();

            if (!updates.description) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler("The service description is required", 400)
                );
            }
        }

        if (req.body.price !== undefined) {
            const parsedPrice = Number(req.body.price);

            if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler("The service price must be a positive number", 400)
                );
            }

            updates.price = parsedPrice;
        }

        if (req.body.isActive !== undefined) {
            updates.isActive = Boolean(req.body.isActive);
        }

        Object.assign(service, updates);
        await service.save({ session });

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
        service
    });
});

// Admin: Delete service (Strictly soft delete - no hard delete) inside a transaction
const deleteService = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid service ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let service;
    try {
        service = await Service.findById(req.params.id).session(session);

        if (!service) {
            await session.abortTransaction();
            return next(new ErrorHandler("Service not found", 404));
        }

        service.isActive = false;
        await service.save({ session });

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
        message: "Service deactivated (soft deleted) successfully",
        service
    });
});

// Admin: Bulk delete services (Strictly soft delete - no hard delete) inside a transaction
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

    const session = await mongoose.startSession();
    session.startTransaction();

    let result;
    try {
        result = await Service.updateMany(
            { _id: { $in: validIds } },
            { isActive: false },
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
        message: `Bulk deactivation complete. ${result.modifiedCount} service(s) marked as inactive (soft deleted).`,
        deleted: result.modifiedCount,
        skipped
    });
});

module.exports = {
    getServices,
    getAdminServices,
    getService,
    createService,
    updateService,
    deleteService,
    bulkDeleteServices
};
