const mongoose = require("mongoose");
const Ticket = require("../models/ticket");
const Service = require("../models/service");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const mockEmail = require("../utils/mockEmail");
const { uploadFiles } = require("../utils/cloudinaryUpload");
const { MAX_PHOTOS } = require("../utils/multer");

// FR 5.3: a ticket walks through these states and every change is recorded
// with its date and time.
const TICKET_STATUS_FLOW = {
    Received: ["Diagnosing", "Waiting for Parts", "Completed"],
    Diagnosing: ["Waiting for Parts", "Completed"],
    "Waiting for Parts": ["Diagnosing", "Completed"],
    Completed: []
};

const ALLOWED_TICKET_STATUSES = Object.keys(TICKET_STATUS_FLOW);

// Builds a readable and unique ticket number, for example AUR-TCK-20261021-0007.
const buildTicketNumber = async (session = null) => {
    const today = new Date();
    const stamp = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("");

    const prefix = `AUR-TCK-${stamp}`;
    const query = Ticket.countDocuments({
        ticketNumber: new RegExp(`^${prefix}`)
    });
    if (session) {
        query.session(session);
    }
    const count = await query;

    return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

// FR 5.2: a verified user opens a support ticket inside a transaction.
const createTicket = catchAsyncErrors(async (req, res, next) => {
    const {
        service,
        watchBrand,
        watchModel,
        problemDescription
    } = req.body;

    if (!service || !watchBrand || !watchModel || !problemDescription) {
        return next(
            new ErrorHandler(
                "Service, watch brand, watch model and problem description are required",
                400
            )
        );
    }

    if (!mongoose.Types.ObjectId.isValid(service)) {
        return next(new ErrorHandler("Invalid service ID", 400));
    }

    const files = req.files || [];

    if (files.length > MAX_PHOTOS) {
        return next(
            new ErrorHandler(`You can upload a maximum of ${MAX_PHOTOS} photos`, 400)
        );
    }

    const photos = files.length > 0 ? await uploadFiles(files, "aureo/tickets") : [];

    const session = await mongoose.startSession();
    session.startTransaction();

    let ticket;
    let chosenService;
    try {
        chosenService = await Service.findById(service).session(session);

        if (!chosenService) {
            await session.abortTransaction();
            return next(new ErrorHandler("Service not found", 404));
        }

        const ticketNumber = await buildTicketNumber(session);

        const [createdTicket] = await Ticket.create(
            [
                {
                    ticketNumber,
                    user: req.user._id,
                    service: chosenService._id,
                    watchBrand: watchBrand.trim(),
                    watchModel: watchModel.trim(),
                    problemDescription: problemDescription.trim(),
                    photos,
                    status: "Received",
                    statusHistory: [{ status: "Received", changedAt: new Date() }]
                }
            ],
            { session }
        );
        ticket = createdTicket;

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    await mockEmail({
        to: req.user.email,
        subject: `Aureo Ticket ${ticket.ticketNumber} received`,
        body: [
            `Dear ${req.user.name},`,
            "",
            `Your support ticket ${ticket.ticketNumber} for ${chosenService.name} has been received.`,
            "",
            `Watch: ${ticket.watchBrand} ${ticket.watchModel}`,
            "",
            "Warm regards,",
            "Aureo Horology Vault"
        ].join("\n"),
        type: "ticket",
        relatedId: ticket._id.toString()
    });

    res.status(201).json({
        success: true,
        message: `Ticket ${ticket.ticketNumber} created.`,
        ticket
    });
});

// FR 5.2: a user sees only their own tickets.
const getMyTickets = catchAsyncErrors(async (req, res) => {
    const tickets = await Ticket.find({ user: req.user._id })
        .populate("service", "name price")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: tickets.length,
        tickets
    });
});

const getTicket = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid ticket ID", 400));
    }

    const ticket = await Ticket.findById(req.params.id)
        .populate("service", "name price description")
        .populate("user", "name email contactNumber avatar");

    if (!ticket) {
        return next(new ErrorHandler("Ticket not found", 404));
    }

    const isOwner = ticket.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return next(
            new ErrorHandler("You are not authorized to view this ticket", 403)
        );
    }

    res.status(200).json({
        success: true,
        ticket
    });
});

// FR 5.3: only an admin changes the status.
const getAdminTickets = catchAsyncErrors(async (req, res) => {
    const tickets = await Ticket.find()
        .populate("service", "name price description")
        .populate("user", "name email contactNumber avatar")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: tickets.length,
        tickets
    });
});

const updateTicketStatus = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid ticket ID", 400));
    }

    const { status } = req.body;

    if (!status) {
        return next(new ErrorHandler("A new status is required", 400));
    }

    if (!ALLOWED_TICKET_STATUSES.includes(status)) {
        return next(
            new ErrorHandler(
                `Invalid ticket status. Allowed values are: ${ALLOWED_TICKET_STATUSES.join(", ")}.`,
                400
            )
        );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let ticket;
    try {
        ticket = await Ticket.findById(req.params.id)
            .populate("service", "name price description")
            .populate("user", "name email contactNumber avatar")
            .session(session);

        if (!ticket) {
            await session.abortTransaction();
            return next(new ErrorHandler("Ticket not found", 404));
        }

        if (ticket.status === "Completed") {
            await session.abortTransaction();
            return next(
                new ErrorHandler("A completed ticket can no longer be changed.", 400)
            );
        }

        const allowedNextStatuses = TICKET_STATUS_FLOW[ticket.status] || [];

        if (!allowedNextStatuses.includes(status)) {
            await session.abortTransaction();
            return next(
                new ErrorHandler(
                    `Ticket cannot move from "${ticket.status}" to "${status}". Allowed next status: ${
                        allowedNextStatuses.length ? allowedNextStatuses.join(", ") : "none"
                    }.`,
                    400
                )
            );
        }

        ticket.status = status;
        ticket.statusHistory.push({ status, changedAt: new Date() });

        await ticket.save({ session });
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    // FR 5.4: the collector is notified about every status change.
    await mockEmail({
        to: ticket.user.email,
        subject: `Aureo Ticket ${ticket.ticketNumber} - Status updated to ${status}`,
        body: [
            `Dear ${ticket.user.name},`,
            "",
            `Your support ticket ${ticket.ticketNumber} is now "${status}".`,
            "",
            "Warm regards,",
            "Aureo Horology Vault"
        ].join("\n"),
        type: "ticket",
        relatedId: ticket._id.toString()
    });

    res.status(200).json({
        success: true,
        message: `Ticket status updated to ${status}`,
        ticket
    });
});

module.exports = {
    createTicket,
    getMyTickets,
    getTicket,
    getAdminTickets,
    updateTicketStatus,
    TICKET_STATUS_FLOW
};
