const mongoose = require("mongoose");
const Order = require("../models/order");
const Product = require("../models/product");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const mockEmail = require("../utils/mockEmail");
const generateReceipt = require("../utils/generateReceipt");

// FR 4.1 / FR 4.2: the order status flow. A completed order can never move
// back to an earlier status and an order can only be cancelled while it is
// still pending.
const ORDER_STATUS_FLOW = {
    Pending: ["Paid", "Cancelled"],
    Paid: ["Shipped"],
    Shipped: ["Completed"],
    Completed: [],
    Cancelled: []
};

const ALLOWED_ORDER_STATUSES = Object.keys(ORDER_STATUS_FLOW);

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
    }).format(Number(amount) || 0);

const buildCheckoutOrderEmail = (order, user) => {
    const lines = order.orderItems.map(
        (item) =>
            `  - ${item.name} | ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(
                item.price * item.quantity
            )}`
    );

    const subtotal = order.orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const grandTotal = order.calculateTotal();
    const { address, city, postalCode, country, phone } = order.shippingInfo || {};

    return [
        `Dear ${user?.name || "Collector"},`,
        "",
        `Thank you for choosing Aureo. Your acquisition order #${order._id} has been received and recorded.`,
        "",
        `Order Number: ${order._id}`,
        `Order Status: ${order.status}`,
        `Payment Method: ${order.paymentMethod} (${order.paymentStatus})`,
        "",
        "Acquired Timepieces:",
        ...lines,
        "",
        `Subtotal: ${formatCurrency(subtotal)}`,
        `Armored Insured Transit: Complimentary`,
        `Grand Total: ${formatCurrency(grandTotal)}`,
        "",
        `Shipping Destination: ${address || ""}, ${city || ""} ${postalCode || ""}, ${country || ""}`.trim(),
        phone ? `Contact Phone: ${phone}` : "",
        "",
        "Your official Aureo PDF receipt is attached to this email.",
        "",
        "Warm regards,",
        "Aureo Horology Vault"
    ]
        .filter((line) => line !== undefined)
        .join("\n");
};

const buildCheckoutOrderHtml = (order, user, titleText = "Acquisition Order Confirmed") => {
    const subtotal = order.orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const grandTotal = order.calculateTotal();
    const { address, city, postalCode, country, phone } = order.shippingInfo || {};

    const itemRowsHtml = order.orderItems
        .map(
            (item) => `
            <tr>
                <td style="padding:12px 8px;border-bottom:1px solid #262936;color:#f5efe2;font-weight:600;">
                    ${item.name}
                </td>
                <td style="padding:12px 8px;border-bottom:1px solid #262936;color:#b8b0a2;text-align:center;">
                    ${item.quantity}
                </td>
                <td style="padding:12px 8px;border-bottom:1px solid #262936;color:#b8b0a2;text-align:right;">
                    ${formatCurrency(item.price)}
                </td>
                <td style="padding:12px 8px;border-bottom:1px solid #262936;color:#e5c687;font-weight:600;text-align:right;">
                    ${formatCurrency(item.price * item.quantity)}
                </td>
            </tr>`
        )
        .join("");

    return `
    <div style="background:#0d0f14;color:#f5efe2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:32px 16px;">
        <div style="max-width:620px;margin:0 auto;background:#151821;border:1px solid rgba(201,164,92,0.38);border-top:3px solid #c9a45c;border-radius:8px;padding:32px;">
            <div style="margin-bottom:24px;">
                <span style="color:#c9a45c;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">AUREO HOROLOGY VAULT</span>
                <h1 style="margin:6px 0 8px;font-size:24px;color:#f7f1e5;font-weight:600;">${titleText}</h1>
                <p style="margin:0;color:#a9a193;font-size:14px;line-height:1.6;">
                    Dear ${user?.name || "Collector"}, thank you for choosing Aureo. Below is the official summary of your order <strong>#${order._id}</strong>.
                </p>
            </div>

            <div style="background:#10131b;border:1px solid #262936;border-radius:6px;padding:16px;margin-bottom:24px;font-size:13px;color:#c7bfb0;">
                <p style="margin:0 0 6px;"><strong>Order Reference:</strong> #${order._id}</p>
                <p style="margin:0 0 6px;"><strong>Current Status:</strong> <span style="color:#e5c687;">${order.status}</span></p>
                <p style="margin:0 0 6px;"><strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
                <p style="margin:0;"><strong>Delivery Destination:</strong> ${address || ""}, ${city || ""} ${postalCode || ""}, ${country || ""} ${phone ? `• ${phone}` : ""}</p>
            </div>

            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
                <thead>
                    <tr style="border-bottom:1px solid #35394a;color:#9e9688;text-transform:uppercase;font-size:11px;letter-spacing:1px;">
                        <th style="padding:8px;text-align:left;">Timepiece</th>
                        <th style="padding:8px;text-align:center;">Qty</th>
                        <th style="padding:8px;text-align:right;">Unit Price</th>
                        <th style="padding:8px;text-align:right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemRowsHtml}
                </tbody>
            </table>

            <div style="border-top:1px solid #262936;padding-top:14px;font-size:14px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#a9a193;">
                    <span>Subtotal: </span>
                    <strong style="color:#f5efe2;float:right;">${formatCurrency(subtotal)}</strong>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#a9a193;">
                    <span>Armored Insured Courier: </span>
                    <strong style="color:#6ee7a8;float:right;">Complimentary</strong>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #262936;font-size:17px;color:#e5c687;">
                    <strong>Grand Total: </strong>
                    <strong style="float:right;">${formatCurrency(grandTotal)}</strong>
                </div>
            </div>

            <p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #262936;font-size:12px;color:#8b8477;line-height:1.5;">
                Your official Aureo PDF invoice/receipt is attached to this email.<br/>
                Warm regards,<br/>
                <strong style="color:#c9a45c;">Aureo Horology Vault</strong>
            </p>
        </div>
    </div>`;
};

const buildOrderStatusEmail = (order, user) => {
    const total = order.calculateTotal();

    return [
        `Dear ${user?.name || "Collector"},`,
        "",
        `Your Aureo order #${order._id} is now "${order.status}".`,
        "",
        `Order total: ${formatCurrency(total)}`,
        `Payment method: ${order.paymentMethod}`,
        "",
        "Warm regards,",
        "Aureo Horology Vault"
    ].join("\n");
};

const buildCompletedOrderEmail = (order, user) => {
    const lines = order.orderItems.map(
        (item) =>
            `  - ${item.name} | ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(
                item.price * item.quantity
            )}`
    );

    const subtotal = order.orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const grandTotal = order.calculateTotal();

    return [
        `Dear ${user?.name || "Collector"},`,
        "",
        "Thank you for choosing Aureo. Your transaction is now complete.",
        "",
        `Order number: ${order._id}`,
        `Status: ${order.status}`,
        "",
        "Items purchased:",
        ...lines,
        "",
        `Subtotal: ${formatCurrency(subtotal)}`,
        `Grand total: ${formatCurrency(grandTotal)}`,
        "",
        "Your PDF receipt is attached to this message.",
        "",
        "Warm regards,",
        "Aureo Horology Vault"
    ].join("\n");
};

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

    // FR 4.5: Send confirmation email with attached PDF receipt upon checkout
    let checkoutAttachments = [];
    try {
        const receiptBuffer = await generateReceipt(order, req.user);
        checkoutAttachments = [
            {
                filename: `aureo-receipt-${order._id}.pdf`,
                content: receiptBuffer,
                contentType: "application/pdf"
            }
        ];
    } catch (pdfErr) {
        console.error("Failed to generate checkout PDF attachment:", pdfErr.message);
    }

    await mockEmail({
        to: req.user.email,
        subject: `Aureo Order Confirmation #${order._id}`,
        body: buildCheckoutOrderEmail(order, req.user),
        html: buildCheckoutOrderHtml(order, req.user, "Acquisition Order Confirmed"),
        type: "order",
        relatedId: order._id.toString(),
        attachments: checkoutAttachments
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

    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

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

    if (!ALLOWED_ORDER_STATUSES.includes(status)) {
        return next(
            new ErrorHandler(
                `Invalid order status. Allowed values are: ${ALLOWED_ORDER_STATUSES.join(", ")}.`,
                400
            )
        );
    }

    // FR 4.2 / assumption 9: the status flow can only move forward.
    const allowedNextStatuses = ORDER_STATUS_FLOW[order.status] || [];

    if (!allowedNextStatuses.includes(status)) {
        return next(
            new ErrorHandler(
                `Order cannot move from "${order.status}" to "${status}". Allowed next status: ${
                    allowedNextStatuses.length ? allowedNextStatuses.join(", ") : "none"
                }.`,
                400
            )
        );
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

    // FR 4.5: every status change notifies the customer.
    if (status === "Completed") {
        // Term Test Lab: the completed transaction email carries the product
        // list, the subtotals and the grand total, and the PDF receipt.
        const receipt = await generateReceipt(order, order.user);

        const attachment = {
            filename: `aureo-receipt-${order._id}.pdf`,
            content: receipt,
            contentType: "application/pdf"
        };

        await mockEmail({
            to: order.user.email,
            subject: `Aureo Transaction Complete - Order #${order._id}`,
            body: buildCompletedOrderEmail(order, order.user),
            html: buildCheckoutOrderHtml(order, order.user, "Transaction Complete — Delivered"),
            type: "order",
            relatedId: order._id.toString(),
            attachments: [attachment]
        });
    } else {
        await mockEmail({
            to: order.user.email,
            subject: `Aureo Order #${order._id} - Status updated to ${status}`,
            body: buildOrderStatusEmail(order, order.user),
            html: buildCheckoutOrderHtml(order, order.user, `Order Status Updated: ${status}`),
            type: "order",
            relatedId: order._id.toString()
        });
    }

    res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
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

// Get Order PDF Receipt
const getOrderReceipt = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
    }
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return next(new ErrorHandler("Unauthorized to view this receipt", 403));
    }
    const pdfBuffer = await generateReceipt(order, order.user);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="aureo-receipt-' + order._id + '.pdf"');
    res.send(pdfBuffer);
});

module.exports = {
    createOrder,
    getMyOrders,
    getSingleOrder,
    getOrderReceipt,
    cancelOrder,
    getAdminOrders,
    updateAdminOrder,
    deleteAdminOrder
};
