const PDFDocument = require("pdfkit");

const GOLD = "#c9a45c";
const DARK_BG = "#12151e";
const INK = "#1a1d24";
const MUTED = "#6b707b";
const BORDER = "#e2e4e9";

const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
    return `PHP ${formatted}`;
};

const formatDate = (date) =>
    new Date(date || Date.now()).toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

// Builds the official PDF receipt attached to order emails and downloadable from the vault.
const generateReceipt = (order, customer = {}) => {
    const items = Array.isArray(order?.orderItems) ? order.orderItems : [];
    const services = Array.isArray(order?.services) ? order.services : [];

    const lineTotal = (item) => Number(item.price || 0) * Number(item.quantity || 1);
    const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
    const serviceTotal = services.reduce(
        (sum, service) => sum + Number(service.price || 0),
        0
    );
    const grandTotal = Number(order?.totalPrice ?? subtotal + serviceTotal);

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 48 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const left = doc.page.margins.left;
        const pageWidth = doc.page.width;
        const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;
        const right = left + contentWidth;

        // Top Dark Luxury Banner
        doc.rect(0, 0, pageWidth, 118).fill(DARK_BG);
        doc.rect(0, 115, pageWidth, 3).fill(GOLD);

        doc
            .fillColor(GOLD)
            .fontSize(24)
            .font("Helvetica-Bold")
            .text("A U R E O", left, 34);

        doc
            .fillColor("#a8a296")
            .fontSize(8.5)
            .font("Helvetica")
            .text("HAUTE HORLOGERIE VAULT  •  GENEVA & MANILA", left, 64);

        doc
            .fillColor("#ffffff")
            .fontSize(15)
            .font("Helvetica-Bold")
            .text("OFFICIAL ACQUISITION RECEIPT", left, 36, {
                width: contentWidth,
                align: "right"
            });

        doc
            .fillColor(GOLD)
            .fontSize(9)
            .font("Helvetica-Bold")
            .text(`STATUS: ${String(order?.status || "CONFIRMED").toUpperCase()}`, left, 60, {
                width: contentWidth,
                align: "right"
            });

        // Order Metadata Strip
        let cursorY = 140;
        doc
            .roundedRect(left, cursorY, contentWidth, 54, 5)
            .fillAndStroke("#f7f8fa", BORDER);

        doc
            .fillColor(MUTED)
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("ORDER REFERENCE", left + 16, cursorY + 12)
            .text("ISSUED DATE", left + 210, cursorY + 12)
            .text("SETTLEMENT METHOD", left + 365, cursorY + 12);

        doc
            .fillColor(INK)
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(`#${order?._id || "N/A"}`, left + 16, cursorY + 26, { width: 185 })
            .font("Helvetica")
            .text(formatDate(order?.createdAt), left + 210, cursorY + 26, { width: 145 })
            .text(
                `${order?.paymentMethod || "N/A"} (${order?.paymentStatus || "Paid"})`,
                left + 365,
                cursorY + 26,
                { width: 125 }
            );

        // Collector & Destination Columns
        cursorY = 214;
        doc
            .fillColor(GOLD)
            .fontSize(8.5)
            .font("Helvetica-Bold")
            .text("COLLECTOR DETAILS", left, cursorY)
            .text("ARMORED COURIER DESTINATION", left + 260, cursorY);

        cursorY += 15;
        const customerName = customer?.name || order?.user?.name || "Aureo Collector";
        const customerEmail = customer?.email || order?.user?.email || "";

        doc
            .fillColor(INK)
            .fontSize(10)
            .font("Helvetica-Bold")
            .text(customerName, left, cursorY);

        if (customerEmail) {
            doc
                .fillColor(MUTED)
                .fontSize(9)
                .font("Helvetica")
                .text(customerEmail, left, cursorY + 14);
        }

        if (order?.shippingInfo) {
            const { address, city, postalCode, country, phone } = order.shippingInfo;
            doc
                .fillColor(INK)
                .fontSize(9.5)
                .font("Helvetica")
                .text(
                    `${address || ""}, ${city || ""} ${postalCode || ""}, ${country || ""}`.trim(),
                    left + 260,
                    cursorY,
                    { width: 235 }
                );
            if (phone) {
                doc
                    .fillColor(MUTED)
                    .fontSize(9)
                    .text(`Contact Tel: ${phone}`, left + 260, doc.y + 3);
            }
        }

        // Itemized Table Header
        cursorY = 285;
        doc.rect(left, cursorY, contentWidth, 26).fill(DARK_BG);

        doc
            .fillColor(GOLD)
            .fontSize(8.5)
            .font("Helvetica-Bold")
            .text("TIMEPIECE / DESCRIPTION", left + 12, cursorY + 9, { width: 230 })
            .text("QTY", left + 245, cursorY + 9, { width: 40, align: "center" })
            .text("UNIT PRICE", left + 290, cursorY + 9, { width: 95, align: "right" })
            .text("LINE TOTAL", left + 390, cursorY + 9, { width: 98, align: "right" });

        cursorY += 34;

        items.forEach((item, index) => {
            if (index % 2 === 1) {
                doc.rect(left, cursorY - 6, contentWidth, 26).fill("#fafbfc");
            }

            doc
                .fillColor(INK)
                .fontSize(9.5)
                .font("Helvetica-Bold")
                .text(item.name || "Timepiece", left + 12, cursorY, { width: 230 });

            doc
                .fillColor(MUTED)
                .font("Helvetica")
                .text(String(item.quantity || 1), left + 245, cursorY, {
                    width: 40,
                    align: "center"
                })
                .text(formatCurrency(item.price), left + 290, cursorY, {
                    width: 95,
                    align: "right"
                });

            doc
                .fillColor(INK)
                .font("Helvetica-Bold")
                .text(formatCurrency(lineTotal(item)), left + 390, cursorY, {
                    width: 98,
                    align: "right"
                });

            cursorY += 24;
            doc
                .moveTo(left, cursorY - 4)
                .lineTo(right, cursorY - 4)
                .strokeColor(BORDER)
                .lineWidth(0.75)
                .stroke();
        });

        services.forEach((service) => {
            doc
                .fillColor(INK)
                .fontSize(9.5)
                .font("Helvetica-Bold")
                .text(`${service.name} (Atelier Service)`, left + 12, cursorY, { width: 230 });

            doc
                .fillColor(MUTED)
                .font("Helvetica")
                .text("1", left + 245, cursorY, { width: 40, align: "center" })
                .text(formatCurrency(service.price), left + 290, cursorY, {
                    width: 95,
                    align: "right"
                });

            doc
                .fillColor(INK)
                .font("Helvetica-Bold")
                .text(formatCurrency(service.price), left + 390, cursorY, {
                    width: 98,
                    align: "right"
                });

            cursorY += 24;
            doc
                .moveTo(left, cursorY - 4)
                .lineTo(right, cursorY - 4)
                .strokeColor(BORDER)
                .lineWidth(0.75)
                .stroke();
        });

        if (items.length === 0 && services.length === 0) {
            doc
                .fillColor(MUTED)
                .fontSize(9.5)
                .font("Helvetica")
                .text("No items recorded on this order.", left + 12, cursorY);
            cursorY += 24;
        }

        // Totals Summary Box
        const summaryTop = cursorY + 14;
        const summaryLeft = right - 230;

        doc
            .fillColor(MUTED)
            .fontSize(9)
            .font("Helvetica")
            .text("Subtotal", summaryLeft, summaryTop, { width: 110, align: "left" });
        doc
            .fillColor(INK)
            .font("Helvetica-Bold")
            .text(formatCurrency(subtotal), summaryLeft + 110, summaryTop, {
                width: 120,
                align: "right"
            });

        doc
            .fillColor(MUTED)
            .font("Helvetica")
            .text("Armored Insured Transit", summaryLeft, summaryTop + 18, {
                width: 120,
                align: "left"
            });
        doc
            .fillColor("#1f8b55")
            .font("Helvetica-Bold")
            .text("COMPLIMENTARY", summaryLeft + 110, summaryTop + 18, {
                width: 120,
                align: "right"
            });

        doc
            .fillColor(MUTED)
            .font("Helvetica")
            .text("5-Position Chronometer Audit", summaryLeft, summaryTop + 36, {
                width: 130,
                align: "left"
            });
        doc
            .fillColor("#1f8b55")
            .font("Helvetica-Bold")
            .text("INCLUDED", summaryLeft + 110, summaryTop + 36, {
                width: 120,
                align: "right"
            });

        if (serviceTotal > 0) {
            doc
                .fillColor(MUTED)
                .font("Helvetica")
                .text("Atelier Services", summaryLeft, summaryTop + 54, {
                    width: 110,
                    align: "left"
                });
            doc
                .fillColor(INK)
                .font("Helvetica-Bold")
                .text(formatCurrency(serviceTotal), summaryLeft + 110, summaryTop + 54, {
                    width: 120,
                    align: "right"
                });
        }

        const totalBarY = summaryTop + (serviceTotal > 0 ? 76 : 58);
        doc.roundedRect(summaryLeft - 10, totalBarY, 240, 34, 4).fill(DARK_BG);

        doc
            .fillColor(GOLD)
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("GRAND TOTAL", summaryLeft + 2, totalBarY + 11, { width: 95, align: "left" });

        doc
            .fillColor("#ffffff")
            .fontSize(11)
            .font("Helvetica-Bold")
            .text(formatCurrency(grandTotal), summaryLeft + 95, totalBarY + 11, {
                width: 125,
                align: "right"
            });

        // Provenance Guarantee Box at Footer
        const footerY = totalBarY + 60;
        doc
            .roundedRect(left, footerY, contentWidth, 56, 5)
            .fillAndStroke("#fcfaf5", "#e6d8bc");

        doc
            .fillColor(INK)
            .fontSize(8.5)
            .font("Helvetica-Bold")
            .text(
                "AUREO PROVENANCE & CHRONOMETER CERTIFICATION",
                left + 14,
                footerY + 12
            );

        doc
            .fillColor(MUTED)
            .fontSize(8)
            .font("Helvetica")
            .text(
                "This document serves as your official Aureo Horology Vault acquisition receipt and 2-Year Maison mechanical warranty record. No sensitive payment card credentials are stored.",
                left + 14,
                footerY + 26,
                { width: contentWidth - 28 }
            );

        doc.end();
    });
};

module.exports = generateReceipt;
module.exports.formatCurrency = formatCurrency;
