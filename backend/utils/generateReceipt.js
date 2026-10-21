const PDFDocument = require("pdfkit");

const GOLD = "#c9a45c";
const INK = "#1a1a1a";
const MUTED = "#6b6b6b";

const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
    }).format(Number(amount) || 0);

const formatDate = (date) =>
    new Date(date || Date.now()).toLocaleString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

// Term Test Lab: builds the PDF receipt that is attached to the completed
// transaction email. It contains the product / service list, the subtotal of
// every line and the grand total. No payment data is ever written to it.
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
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const left = doc.page.margins.left;
        const contentWidth =
            doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const right = left + contentWidth;

        // Header
        doc.fillColor(GOLD).fontSize(26).font("Helvetica-Bold").text("AUREO", left, 50);
        doc
            .fillColor(MUTED)
            .fontSize(9)
            .font("Helvetica")
            .text("WATCH HOROLOGY VAULT", left, doc.y + 2);

        doc
            .fillColor(INK)
            .fontSize(16)
            .font("Helvetica-Bold")
            .text("Transaction Receipt", left, 95);

        doc
            .fillColor(MUTED)
            .fontSize(9)
            .font("Helvetica")
            .text(`Order ${order?._id || ""}`, left, doc.y + 2)
            .text(`Issued ${formatDate(order?.createdAt)}`, left, doc.y);

        // Customer + shipping block
        let cursorY = doc.y + 18;

        doc.fillColor(INK).fontSize(10).font("Helvetica-Bold").text("Billed to", left, cursorY);
        doc
            .fillColor(MUTED)
            .fontSize(9)
            .font("Helvetica")
            .text(customer.name || order?.user?.name || "Aureo customer", left, doc.y + 2)
            .text(customer.email || order?.user?.email || "", left, doc.y);

        if (order?.shippingInfo) {
            const { address, city, postalCode, country, phone } = order.shippingInfo;

            doc.text(
                `Ship to: ${address}, ${city} ${postalCode || ""} ${country || ""}`.trim(),
                left,
                doc.y
            );

            if (phone) {
                doc.text(`Contact: ${phone}`, left, doc.y);
            }
        }

        cursorY = doc.y + 16;

        // Item table
        doc
            .fillColor(INK)
            .fontSize(9)
            .font("Helvetica-Bold")
            .text("ITEM", left, cursorY)
            .text("QTY", left + 250, cursorY, { width: 40, align: "right" })
            .text("PRICE", left + 300, cursorY, { width: 80, align: "right" })
            .text("SUBTOTAL", left + 390, cursorY, { width: 80, align: "right" });

        cursorY = doc.y + 4;

        doc
            .moveTo(left, cursorY)
            .lineTo(right, cursorY)
            .strokeColor("#dddddd")
            .lineWidth(1)
            .stroke();

        cursorY += 8;

        doc.font("Helvetica").fontSize(9).fillColor(INK);

        items.forEach((item) => {
            const y = cursorY;

            doc.text(item.name || "Watch", left, y, { width: 240 });
            doc.text(String(item.quantity || 1), left + 250, y, { width: 40, align: "right" });
            doc.text(formatCurrency(item.price), left + 300, y, { width: 80, align: "right" });
            doc.text(
                formatCurrency(lineTotal(item)),
                left + 390,
                y,
                { width: 80, align: "right" }
            );

            cursorY = doc.y + 6;
        });

        services.forEach((service) => {
            const y = cursorY;

            doc.text(`${service.name} (service)`, left, y, { width: 240 });
            doc.text("1", left + 250, y, { width: 40, align: "right" });
            doc.text(formatCurrency(service.price), left + 300, y, { width: 80, align: "right" });
            doc.text(formatCurrency(service.price), left + 390, y, { width: 80, align: "right" });

            cursorY = doc.y + 6;
        });

        if (items.length === 0 && services.length === 0) {
            doc.fillColor(MUTED).text("No items on this order.", left, cursorY);
            cursorY = doc.y + 6;
        }

        // Totals
        const totalsY = cursorY + 10;

        doc
            .moveTo(left, totalsY)
            .lineTo(right, totalsY)
            .strokeColor("#dddddd")
            .lineWidth(1)
            .stroke();

        doc
            .fillColor(MUTED)
            .fontSize(9)
            .font("Helvetica")
            .text("Subtotal", right - 120, totalsY + 8, { width: 120, align: "right" });

        doc
            .fillColor(INK)
            .font("Helvetica-Bold")
            .text(formatCurrency(subtotal), right - 120, totalsY + 8, { width: 120, align: "right" });

        if (serviceTotal > 0) {
            doc
                .fillColor(MUTED)
                .font("Helvetica")
                .text("Services", right - 120, doc.y + 2, { width: 120, align: "right" });

            doc
                .fillColor(INK)
                .font("Helvetica-Bold")
                .text(formatCurrency(serviceTotal), right - 120, doc.y, {
                    width: 120,
                    align: "right"
                });
        }

        doc
            .fillColor(GOLD)
            .fontSize(11)
            .font("Helvetica-Bold")
            .text("Grand Total", right - 120, doc.y + 8, { width: 120, align: "right" });

        doc
            .fontSize(12)
            .text(formatCurrency(grandTotal), right - 120, doc.y, { width: 120, align: "right" });

        // Footer
        doc
            .fillColor(MUTED)
            .fontSize(8)
            .font("Helvetica")
            .text(
                "Payment method: " + (order?.paymentMethod || "N/A"),
                left,
                doc.y + 26
            );

        doc.text(
            "This receipt was generated automatically by Aureo. No card details are stored.",
            left,
            doc.y + 2
        );

        doc.end();
    });
};

module.exports = generateReceipt;
module.exports.formatCurrency = formatCurrency;
