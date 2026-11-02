const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");
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
    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim();
    const apiBaseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    const orderUrl = `${clientUrl}/order/${order._id}`;

    const userId = user?._id || order?.user?._id || order?.user;
    let pdfDownloadUrl = orderUrl;
    if (userId && process.env.JWT_SECRET) {
        try {
            const receiptToken = jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
                expiresIn: "30d"
            });
            pdfDownloadUrl = `${apiBaseUrl}/api/v1/order/${order._id}/receipt?token=${encodeURIComponent(
                receiptToken
            )}&download=1`;
        } catch (err) {
            pdfDownloadUrl = orderUrl;
        }
    }

    const statusBadgeBg =
        order.status === "Completed" || order.status === "Paid"
            ? "#132a20"
            : order.status === "Cancelled"
            ? "#2d1619"
            : "#2a2315";
    const statusBadgeBorder =
        order.status === "Completed" || order.status === "Paid"
            ? "#2e6f4e"
            : order.status === "Cancelled"
            ? "#7f2d36"
            : "#7a6133";
    const statusBadgeColor =
        order.status === "Completed" || order.status === "Paid"
            ? "#6ee7a8"
            : order.status === "Cancelled"
            ? "#f87171"
            : "#e5c687";

    const itemRowsHtml = order.orderItems
        .map((item) => {
            const thumbCell = item.image
                ? `<td width="56" valign="middle" style="padding:14px 12px 14px 0;border-bottom:1px solid #232734;">
                        <img src="${item.image}" alt="${item.name}" width="48" height="48" style="display:block;width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #2e3344;background:#0b0c10;" />
                   </td>`
                : "";

            return `
            <tr>
                <td style="padding:0;border-bottom:1px solid #232734;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            ${thumbCell}
                            <td valign="middle" style="padding:14px 8px 14px 0;color:#f7f1e5;font-size:14px;font-weight:600;">
                                ${item.name}
                            </td>
                        </tr>
                    </table>
                </td>
                <td width="50" align="center" valign="middle" style="padding:14px 8px;border-bottom:1px solid #232734;color:#b8b0a2;font-size:13px;">
                    ${item.quantity}
                </td>
                <td width="120" align="right" valign="middle" style="padding:14px 8px;border-bottom:1px solid #232734;color:#b8b0a2;font-size:13px;white-space:nowrap;">
                    ${formatCurrency(item.price)}
                </td>
                <td width="130" align="right" valign="middle" style="padding:14px 0 14px 8px;border-bottom:1px solid #232734;color:#e5c687;font-size:14px;font-weight:700;white-space:nowrap;">
                    ${formatCurrency(item.price * item.quantity)}
                </td>
            </tr>`;
        })
        .join("");

    return `
    <div style="margin:0;padding:36px 16px;background-color:#0b0d12;color:#f5efe2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;background-color:#141720;border:1px solid #3a3222;border-top:3px solid #c9a45c;border-radius:10px;overflow:hidden;">
            <!-- Header Banner -->
            <tr>
                <td style="padding:32px 32px 24px 32px;border-bottom:1px solid #222634;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="left" valign="top">
                                <div style="color:#c9a45c;font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:8px;">
                                    AUREO HOROLOGY VAULT
                                </div>
                                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#f7f1e5;font-weight:600;font-family:Georgia,'Times New Roman',serif;">
                                    ${titleText}
                                </h1>
                            </td>
                            <td align="right" valign="top">
                                <span style="display:inline-block;padding:5px 12px;border-radius:999px;background-color:${statusBadgeBg};border:1px solid ${statusBadgeBorder};color:${statusBadgeColor};font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                                    ${order.status}
                                </span>
                            </td>
                        </tr>
                    </table>
                    <p style="margin:14px 0 0 0;color:#a9a193;font-size:14px;line-height:1.6;">
                        Dear <strong style="color:#f5efe2;">${user?.name || "Collector"}</strong>, thank you for choosing Aureo. Below is the official archival summary of your acquisition.
                    </p>
                </td>
            </tr>

            <!-- Order Metadata Box -->
            <tr>
                <td style="padding:24px 32px 8px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f1219;border:1px solid #252938;border-radius:8px;">
                        <tr>
                            <td width="50%" valign="top" style="padding:16px 18px;border-right:1px solid #222634;border-bottom:1px solid #222634;">
                                <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8b8477;margin-bottom:4px;">
                                    Order Reference
                                </div>
                                <div style="font-size:13px;font-weight:600;color:#f5efe2;word-break:break-all;">
                                    #${order._id}
                                </div>
                            </td>
                            <td width="50%" valign="top" style="padding:16px 18px;border-bottom:1px solid #222634;">
                                <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8b8477;margin-bottom:4px;">
                                    Acquisition Date
                                </div>
                                <div style="font-size:13px;font-weight:600;color:#f5efe2;">
                                    ${formattedDate}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td width="50%" valign="top" style="padding:16px 18px;border-right:1px solid #222634;">
                                <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8b8477;margin-bottom:4px;">
                                    Settlement Method
                                </div>
                                <div style="font-size:13px;font-weight:600;color:#f5efe2;">
                                    ${order.paymentMethod} <span style="color:#c9a45c;">(${order.paymentStatus})</span>
                                </div>
                            </td>
                            <td width="50%" valign="top" style="padding:16px 18px;">
                                <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8b8477;margin-bottom:4px;">
                                    Armored Courier Destination
                                </div>
                                <div style="font-size:13px;color:#d6cfc2;line-height:1.45;">
                                    ${address || ""}${city ? `, ${city}` : ""} ${postalCode || ""}${country ? `, ${country}` : ""}
                                    ${phone ? `<br/><span style="color:#9e9688;font-size:12px;">Tel: ${phone}</span>` : ""}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- Itemized Timepieces Table -->
            <tr>
                <td style="padding:20px 32px 8px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                        <thead>
                            <tr>
                                <th align="left" style="padding:10px 8px 10px 0;border-bottom:1px solid #32374a;color:#9e9688;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
                                    Timepiece
                                </th>
                                <th width="50" align="center" style="padding:10px 8px;border-bottom:1px solid #32374a;color:#9e9688;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
                                    Qty
                                </th>
                                <th width="120" align="right" style="padding:10px 8px;border-bottom:1px solid #32374a;color:#9e9688;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
                                    Unit Price
                                </th>
                                <th width="130" align="right" style="padding:10px 0 10px 8px;border-bottom:1px solid #32374a;color:#9e9688;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">
                                    Subtotal
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRowsHtml}
                        </tbody>
                    </table>
                </td>
            </tr>

            <!-- Totals Breakdown Table (Email-safe left/right cells) -->
            <tr>
                <td style="padding:12px 32px 20px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f1219;border:1px solid #252938;border-radius:8px;padding:18px 20px;">
                        <tr>
                            <td align="left" style="padding:5px 0;font-size:13px;color:#a9a193;">
                                Subtotal
                            </td>
                            <td align="right" style="padding:5px 0;font-size:13px;font-weight:600;color:#f5efe2;white-space:nowrap;">
                                ${formatCurrency(subtotal)}
                            </td>
                        </tr>
                        <tr>
                            <td align="left" style="padding:5px 0;font-size:13px;color:#a9a193;">
                                Armored Insured Courier
                            </td>
                            <td align="right" style="padding:5px 0;font-size:13px;font-weight:600;color:#6ee7a8;white-space:nowrap;">
                                Complimentary
                            </td>
                        </tr>
                        <tr>
                            <td align="left" style="padding:5px 0 12px 0;font-size:13px;color:#a9a193;border-bottom:1px solid #232734;">
                                5-Position Chronometer &amp; Provenance Audit
                            </td>
                            <td align="right" style="padding:5px 0 12px 0;font-size:13px;font-weight:600;color:#6ee7a8;border-bottom:1px solid #232734;white-space:nowrap;">
                                Included
                            </td>
                        </tr>
                        <tr>
                            <td align="left" style="padding:14px 0 2px 0;font-size:16px;font-weight:700;color:#f7f1e5;">
                                Grand Total
                            </td>
                            <td align="right" style="padding:14px 0 2px 0;font-size:18px;font-weight:700;color:#e5c687;white-space:nowrap;">
                                ${formatCurrency(grandTotal)}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- Interactive Official PDF Invoice Card inside Email -->
            <tr>
                <td style="padding:0 32px 20px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#191d28;border:1px solid #4a3e28;border-radius:8px;padding:14px 18px;">
                        <tr>
                            <td width="42" valign="middle" style="padding-right:12px;">
                                <div style="width:38px;height:38px;border-radius:6px;background-color:#262015;border:1px solid #c9a45c;color:#e5c687;font-size:11px;font-weight:800;line-height:38px;text-align:center;">
                                    PDF
                                </div>
                            </td>
                            <td valign="middle" align="left">
                                <div style="font-size:13px;font-weight:700;color:#f7f1e5;">
                                    aureo-receipt-${order._id}.pdf
                                </div>
                                <div style="font-size:11px;color:#a9a193;margin-top:2px;">
                                    Official Aureo Acquisition Invoice &bull; Attached &amp; Ready for Download
                                </div>
                            </td>
                            <td valign="middle" align="right" style="padding-left:12px;white-space:nowrap;">
                                <a href="${pdfDownloadUrl}" target="_blank" style="display:inline-block;padding:9px 14px;background-color:#c9a45c;color:#0d0f14;font-size:12px;font-weight:700;text-decoration:none;border-radius:5px;">
                                    Download PDF ↓
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- CTA Buttons Row -->
            <tr>
                <td style="padding:0 32px 28px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="left" valign="middle">
                                <a href="${orderUrl}" style="display:inline-block;padding:12px 20px;background-color:transparent;border:1px solid #c9a45c;color:#e5c687;font-size:13px;font-weight:700;text-decoration:none;border-radius:5px;letter-spacing:0.4px;">
                                    View Order &amp; Provenance Timeline →
                                </a>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="padding:18px 32px 24px 32px;background-color:#10121a;border-top:1px solid #222634;font-size:12px;color:#8b8477;line-height:1.6;">
                    Your official PDF invoice (<code style="color:#e5c687;">aureo-receipt-${order._id}.pdf</code>) is both clickable above and attached as a file to this email.<br/>
                    <span style="display:inline-block;margin-top:6px;">Warm regards, <strong style="color:#c9a45c;">Aureo Horology Vault</strong> &bull; Geneva &amp; Manila</span>
                </td>
            </tr>
        </table>
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
        "Your updated PDF receipt is attached to this email.",
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

// Helper to build the Nodemailer PDF attachment for an order
const buildPdfAttachment = async (order, user) => {
    try {
        const receiptBuffer = await generateReceipt(order, user);
        return [
            {
                filename: `aureo-receipt-${order._id}.pdf`,
                content: Buffer.from(receiptBuffer),
                contentType: "application/pdf",
                contentDisposition: "attachment"
            }
        ];
    } catch (pdfErr) {
        console.error("Failed to generate PDF receipt attachment:", pdfErr.message);
        return [];
    }
};

// FR 4.1 & FR 4.2 & FR 4.3: Create new order using a MongoDB ACID Transaction
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
            return next(
                new ErrorHandler(
                    "Transaction declined: Test card number 4000 0000 0000 0002 was declined by the issuer.",
                    400
                )
            );
        }
        paymentStatus = "Paid";
        orderInitialStatus = "Paid";
    } else if (normalizedMethod === "E-Wallet") {
        paymentStatus = "Paid";
        orderInitialStatus = "Paid";
    }

    // Begin MongoDB multi-document transaction for stock deduction + order creation
    const session = await mongoose.startSession();
    session.startTransaction();

    let order;
    try {
        const verifiedOrderItems = [];

        for (const item of orderItems) {
            if (!mongoose.Types.ObjectId.isValid(item.product)) {
                await session.abortTransaction();
                return next(new ErrorHandler(`Invalid product ID: ${item.product}`, 400));
            }

            const product = await Product.findById(item.product).session(session);
            if (!product || !product.isActive) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler(`Timepiece "${item.name || item.product}" is unavailable`, 404)
                );
            }

            const quantity = Math.max(Number(item.quantity) || 1, 1);

            if (product.condition === "second-hand" && quantity > 1) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler(
                        `Second-hand piece "${product.name}" is a unique piece (max 1)`,
                        400
                    )
                );
            }

            if (product.stock < quantity) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler(
                        `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
                        400
                    )
                );
            }

            // Atomic stock decrement within the active transaction session
            const updatedProduct = await Product.findOneAndUpdate(
                { _id: product._id, stock: { $gte: quantity } },
                { $inc: { stock: -quantity } },
                { new: true, session }
            );

            if (!updatedProduct) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler(
                        `Acquisition conflict: "${product.name}" was just reserved by another collector.`,
                        409
                    )
                );
            }

            verifiedOrderItems.push({
                product: product._id,
                name: product.name,
                price: product.price, // Server verified price
                quantity,
                image: product.images?.[0]?.url || item.image || ""
            });
        }

        const createdOrders = await Order.create(
            [
                {
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
                }
            ],
            { session }
        );

        order = createdOrders[0];

        // Commit transaction once all stock updates and order creation succeed
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    // FR 4.5: Send confirmation email with attached PDF receipt upon checkout
    const checkoutAttachments = await buildPdfAttachment(order, req.user);

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

// User: Cancel order (Pending orders only, restores stock inside a transaction)
const cancelOrder = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let order;
    try {
        order = await Order.findById(req.params.id).session(session);

        if (!order) {
            await session.abortTransaction();
            return next(new ErrorHandler("Order not found", 404));
        }

        if (order.user.toString() !== req.user._id.toString()) {
            await session.abortTransaction();
            return next(new ErrorHandler("You can only cancel your own orders", 403));
        }

        if (order.status !== "Pending") {
            await session.abortTransaction();
            return next(
                new ErrorHandler(
                    `Order cannot be cancelled because its current status is "${order.status}". Only Pending orders may be cancelled.`,
                    400
                )
            );
        }

        // Restore stock for each timepiece within the transaction
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } },
                { session }
            );
        }

        order.status = "Cancelled";
        order.statusHistory.push({
            status: "Cancelled",
            changedAt: new Date()
        });

        await order.save({ session });
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

// Admin: Update order status (with transaction for status + stock restoration)
const updateAdminOrder = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
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

    const session = await mongoose.startSession();
    session.startTransaction();

    let order;
    try {
        order = await Order.findById(req.params.id)
            .populate("user", "name email")
            .session(session);

        if (!order) {
            await session.abortTransaction();
            return next(new ErrorHandler("Order not found", 404));
        }

        if (order.status === "Completed") {
            await session.abortTransaction();
            return next(new ErrorHandler("Completed orders cannot be modified.", 400));
        }

        // FR 4.2 / assumption 9: the status flow can only move forward.
        const allowedNextStatuses = ORDER_STATUS_FLOW[order.status] || [];

        if (!allowedNextStatuses.includes(status)) {
            await session.abortTransaction();
            return next(
                new ErrorHandler(
                    `Order cannot move from "${order.status}" to "${status}". Allowed next status: ${
                        allowedNextStatuses.length ? allowedNextStatuses.join(", ") : "none"
                    }.`,
                    400
                )
            );
        }

        // If cancelled by admin, restore stock within the transaction
        if (status === "Cancelled" && order.status !== "Cancelled") {
            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: item.quantity } },
                    { session }
                );
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

        await order.save({ session });
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        throw txError;
    } finally {
        session.endSession();
    }

    // Generate PDF receipt attachment for every status notification
    const attachments = await buildPdfAttachment(order, order.user);

    // FR 4.5: every status change notifies the customer with the updated PDF receipt attached.
    if (status === "Completed") {
        await mockEmail({
            to: order.user.email,
            subject: `Aureo Transaction Complete - Order #${order._id}`,
            body: buildCompletedOrderEmail(order, order.user),
            html: buildCheckoutOrderHtml(order, order.user, "Transaction Complete — Delivered"),
            type: "order",
            relatedId: order._id.toString(),
            attachments
        });
    } else {
        await mockEmail({
            to: order.user.email,
            subject: `Aureo Order #${order._id} - Status updated to ${status}`,
            body: buildOrderStatusEmail(order, order.user),
            html: buildCheckoutOrderHtml(order, order.user, `Order Status Updated: ${status}`),
            type: "order",
            relatedId: order._id.toString(),
            attachments
        });
    }

    res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
        order
    });
});

// Admin: Delete order (soft delete: marks Cancelled and restores stock inside a transaction)
const deleteAdminOrder = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let order;
    try {
        order = await Order.findById(req.params.id).session(session);
        if (!order) {
            await session.abortTransaction();
            return next(new ErrorHandler("Order not found", 404));
        }

        // Soft delete: set status to Cancelled and restore inventory if not already cancelled
        if (order.status !== "Cancelled") {
            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { stock: item.quantity } },
                    { session }
                );
            }
            order.status = "Cancelled";
            order.statusHistory.push({
                status: "Cancelled",
                changedAt: new Date()
            });
            await order.save({ session });
        }

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
        message: "Order cancelled (soft deleted) successfully",
        order
    });
});

// Get Order PDF Receipt (supports Bearer header OR ?token= query param from email links)
const getOrderReceipt = catchAsyncErrors(async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return next(new ErrorHandler("Invalid order ID", 400));
    }

    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
        token = String(req.query.token);
    }

    if (!token) {
        return next(new ErrorHandler("Please log in to access this receipt", 401));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return next(new ErrorHandler("Invalid or expired receipt link. Please log in again.", 401));
    }

    const requestingUser = await User.findById(decoded.id);
    if (!requestingUser) {
        return next(new ErrorHandler("User not found", 401));
    }

    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
        return next(new ErrorHandler("Order not found", 404));
    }

    const isOwner = order.user._id.toString() === requestingUser._id.toString();
    const isAdmin = requestingUser.role === "admin";
    if (!isOwner && !isAdmin) {
        return next(new ErrorHandler("Unauthorized to view this receipt", 403));
    }

    const pdfBuffer = await generateReceipt(order, order.user);
    const dispositionType = req.query.download === "1" ? "attachment" : "inline";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `${dispositionType}; filename="aureo-receipt-${order._id}.pdf"`
    );
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
