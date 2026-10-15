const mongoose = require("mongoose");
const Order = require("../models/order");
const Product = require("../models/product");
const EmailLog = require("../models/emailLog");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");

// FR 4.1 & FR 4.2 & FR 4.3: Create new order
const createOrder = catchAsyncErrors(async (req, res, next) => {
    const { orderItems, shippingInfo, paymentMethod, cardNumber } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return next(new ErrorHandler("No order items provided", 400));
    }

    if (!shippingInfo || !shippingInfo.address || !shippingInfo.city || !shippingInfo.phone) {
        return next(new ErrorHandler("Complete shipping information is required", 400));
    }

    // FR 4.2: Mock Payment & Card Decline Check (Assumption 3: 4000 0000 0000 0002)
    const normalizedMethod = paymentMethod || "Cash";
    let paymentStatus = "Pending";
    let orderInitialStatus = "Pending";

    if (normalizedMethod === "Dummy Credit Card") {
        const cleanCard = String(cardNumber || "").replace(/\s+/g, "");
        if (cleanCard === "4000000000000002") {
            return next(new ErrorHandler("Transaction declined: Test card number 4000 0000 0000 0002 was declined by the issuer.", 400));
        }
        paymentStatus = "Paid";
        orderInitialStatus = "Paid";
    } else if (normalizedMethod === "E-Wallet") {
        paymentStatus = "Paid";
        orderInitialStatus = "Paid";
    }

    // Server-side price recalculation & stock validation
    const verifiedOrderItems = [];
    const reducedProductUpdates = [];

    for (const item of orderItems) {
        if (!mongoose.Types.ObjectId.isValid(item.product)) {
            return next(new ErrorHandler(`Invalid product ID: ${item.product}`, 400));
        }

        const product = await Product.findById(item.product);
        if (!product || !product.isActive) {
            return next(new ErrorHandler(`Timepiece "${item.name || item.product}" is unavailable`, 404));
        }

        const quantity = Math.max(Number(item.quantity) || 1, 1);

        if (product.condition === "second-hand" && quantity > 1) {
            return next(new ErrorHandler(`Second-hand piece "${product.name}" is a unique piece (max 1)`, 400));
        }

        if (product.stock < quantity) {
            return next(new ErrorHandler(`Insufficient stock for "${product.name}". Only ${product.stock} available.`, 400));
        }

        // Attempt atomic stock decrement
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: product._id, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true }
        );

        if (!updatedProduct) {
            // Rollback any earlier reductions
            for (const prev of reducedProductUpdates) {
                await Product.findByIdAndUpdate(prev.id, { $inc: { stock: prev.qty } });
            }
            return next(new ErrorHandler(`Acquisition conflict: "${product.name}" was just reserved by another collector.`, 409));
        }

        reducedProductUpdates.push({ id: product._id, qty: quantity });

        verifiedOrderItems.push({
            product: product._id,
            name: product.name,
            price: product.price, // Server verified price
            quantity: quantity,
            image: product.images?.[0]?.url || item.image || ""
        });
    }

    const order = await Order.create({
        user: req.user._id,
        orderItems: verifiedOrderItems,
        shippingInfo,
        paymentMethod: normalizedMethod,
        paymentStatus,
        status: orderInitialStatus,
        statusHistory: [
            {
                status: orderInitialStatus,
                changedAt: new Date()
            }
        ]
    });

    // FR 4.5: Record mock confirmation email
    const totalPrice = order.calculateTotal();
    const formattedTotal = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
    }).format(totalPrice);

    await EmailLog.create({
        to: req.user.email,
        subject: `Aureo Order Confirmation #${order._id}`,
        body: `Dear ${req.user.name},\n\nThank you for choosing Aureo. Your order #${order._id} for ${order.orderItems.length} timepiece(s) totalling ${formattedTotal} has been recorded.\n\nShipping to: ${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.country}.\n\nWarm regards,\nAureo Horology Vault`,
        type: "order",
        status: "sent",
        relatedId: order._id.toString()
    });

    res.status(201).json({
        success: true,
        order
    });
});

// User: Get my orders
const getMyOrders = catchAsyncErrors(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        orders
    });
});

// User / Admin: Get single order
const getSingleOrder = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
    }

    const order = await Order.findById(req.params.id).populate("user", "name email contactNumber");

    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return next(new ErrorHandler("You are not authorized to view this order", 403));
    }

    res.status(200).json({
        success: true,
        order
    });
});

// User: Cancel order (Pending orders only, restores stock)
const cancelOrder = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    if (order.user.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only cancel your own orders", 403));
    }

    if (order.status !== "Pending") {
        return next(new ErrorHandler(`Order cannot be cancelled because its current status is "${order.status}". Only Pending orders may be cancelled.`, 400));
    }

    // Atomically restore stock
    for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
        });
    }

    order.status = "Cancelled";
    order.statusHistory.push({
        status: "Cancelled",
        changedAt: new Date()
    });

    await order.save();

    res.status(200).json({
        success: true,
        message: "Order cancelled successfully and timepiece inventory restored to vault.",
        order
    });
});

// Admin: Get all orders
const getAdminOrders = catchAsyncErrors(async (req, res) => {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });

    const totalAmount = orders.reduce((acc, order) => acc + order.calculateTotal(), 0);

    res.status(200).json({
        success: true,
        totalOrders: orders.length,
        totalAmount,
        orders
    });
});

// Admin: Update order status
const updateAdminOrder = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    if (order.status === "Completed") {
        return next(new ErrorHandler("Completed orders cannot be modified.", 400));
    }

    const { status } = req.body;

    if (!status) {
        return next(new ErrorHandler("New status is required", 400));
    }

    // If cancelled by admin, restore stock
    if (status === "Cancelled" && order.status !== "Cancelled") {
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }
    }

    order.status = status;
    if (status === "Paid") {
        order.paymentStatus = "Paid";
    }

    order.statusHistory.push({
        status,
        changedAt: new Date()
    });

    await order.save();

    res.status(200).json({
        success: true,
        order
    });
});

// Admin: Delete order (soft delete: marks Cancelled and restores stock)
const deleteAdminOrder = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    // Soft delete: set status to Cancelled and restore inventory if not already cancelled
    if (order.status !== "Cancelled") {
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }
        order.status = "Cancelled";
        order.statusHistory.push({
            status: "Cancelled",
            changedAt: new Date()
        });
        await order.save();
    }

    res.status(200).json({
        success: true,
        message: "Order cancelled (soft deleted) successfully",
        order
    });
});

module.exports = {
    createOrder,
    getMyOrders,
    getSingleOrder,
    cancelOrder,
    getAdminOrders,
    updateAdminOrder,
    deleteAdminOrder
};
