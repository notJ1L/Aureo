const mongoose = require("mongoose");
const { createSmtpTransporter } = require("./sendEmail");
const EmailLog = require("../models/emailLog");
const Order = require("../models/order");
const User = require("../models/user");
const generateReceipt = require("./generateReceipt");

const buildFallbackRegistrationHtml = (user, fallbackEmail) => {
    const clientUrl = (process.env.CLIENT_URL || "https://aureo-frontend.onrender.com")
        .split(",")
        .map((u) => u.trim())
        .pop()
        .replace(/\/$/, "");
    const name = user?.name || "Collector";
    const email = user?.email || fallbackEmail;
    const registrationDate = new Date(user?.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const methodLabel = user?.authSource === "google" ? "Google Identity" : "Email & Password";

    return `
    <div style="margin:0;padding:36px 16px;background-color:#07080a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#f5f2eb;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;background-color:#0e1014;border:1px solid #262930;border-top:3px solid #c9a96e;border-radius:12px;overflow:hidden;">
            <tr>
                <td style="padding:32px 36px 24px;border-bottom:1px solid #1b1e24;background:linear-gradient(180deg,#13161c 0%,#0e1014 100%);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="left" valign="middle">
                                <div style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#c9a96e;font-weight:700;">
                                    AUREO HOROLOGY VAULT
                                </div>
                            </td>
                            <td align="right" valign="middle">
                                <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background-color:rgba(74,222,128,0.14);color:#4ade80;border:1px solid rgba(74,222,128,0.35);">
                                    REGISTRATION ACKNOWLEDGED
                                </span>
                            </td>
                        </tr>
                    </table>
                    <h1 style="margin:14px 0 8px;font-size:26px;font-weight:600;color:#f5f2eb;font-family:Georgia,'Times New Roman',serif;letter-spacing:0.01em;">
                        Welcome to Aureo Horology Vault
                    </h1>
                    <p style="margin:0;color:#9da3ae;font-size:14px;line-height:1.6;">
                        Dear <strong style="color:#f5f2eb;">${name}</strong>, this email officially acknowledges that you have registered an Aureo Collector account using <strong style="color:#c9a96e;">${email}</strong>.
                    </p>
                </td>
            </tr>
            <tr>
                <td style="padding:28px 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#13161c;border:1px solid #22262e;border-radius:10px;margin-bottom:24px;">
                        <tr>
                            <td width="50%" valign="top" style="padding:16px 20px;border-bottom:1px solid #1e222a;border-right:1px solid #1e222a;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Collector Name</div>
                                <div style="font-size:13px;color:#f5f2eb;font-weight:600;">${name}</div>
                            </td>
                            <td width="50%" valign="top" style="padding:16px 20px;border-bottom:1px solid #1e222a;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Registered Email</div>
                                <div style="font-size:13px;color:#c9a96e;font-weight:600;">${email}</div>
                            </td>
                        </tr>
                        <tr>
                            <td width="50%" valign="top" style="padding:16px 20px;border-right:1px solid #1e222a;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Membership Tier</div>
                                <div style="font-size:13px;color:#4ade80;font-weight:600;">Active Private Collector</div>
                            </td>
                            <td width="50%" valign="top" style="padding:16px 20px;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Registration Date &amp; Method</div>
                                <div style="font-size:13px;color:#f5f2eb;font-weight:600;">${registrationDate} <span style="color:#9da3ae;font-weight:400;">(${methodLabel})</span></div>
                            </td>
                        </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                        <tr>
                            <td align="left">
                                <a href="${clientUrl}/catalog" style="display:inline-block;padding:12px 24px;background-color:#c9a96e;color:#0a0b0d;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:6px;">
                                    Explore the Aureo Collection &rarr;
                                </a>
                            </td>
                        </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #1e222a;padding-top:18px;">
                        <tr>
                            <td style="padding-top:16px;">
                                <p style="margin:0 0 8px;font-size:12px;color:#9da3ae;line-height:1.6;">
                                    <strong style="color:#f5f2eb;">Registration Acknowledgement:</strong> This email confirms that <span style="color:#c9a96e;">${email}</span> was registered with Aureo Horology Vault.
                                </p>
                                <p style="margin:0;font-size:12px;color:#737984;">
                                    Warm regards, <strong style="color:#c9a96e;">Aureo Horology Vault</strong> &bull; Geneva &amp; Manila
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>`;
};

let isFlushing = false;

const flushFailedEmails = async () => {
    if (isFlushing) {
        return 0;
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        return 0;
    }

    isFlushing = true;

    try {
        const cutoff = new Date(Date.now() - 60 * 60 * 1000);
        let deliveredCount = 0;
        const transporter = createSmtpTransporter();

        // Atomically claim one pending email at a time to prevent duplicate deliveries across intervals or processes
        while (true) {
            const log = await EmailLog.findOneAndUpdate(
                {
                    status: "failed",
                    createdAt: { $gte: cutoff }
                },
                {
                    $set: {
                        status: "processing",
                        updatedAt: new Date()
                    }
                },
                { sort: { createdAt: 1 }, new: true }
            );

            if (!log) {
                break;
            }

            try {
                let attachments = [];
                let html = log.html;

                if (log.type === "order" && log.relatedId && mongoose.Types.ObjectId.isValid(log.relatedId)) {
                    const order = await Order.findById(log.relatedId).populate("user", "name email contactNumber");
                    if (order) {
                        const receiptBuffer = await generateReceipt(order, order.user);
                        attachments = [
                            {
                                filename: `aureo-receipt-${order._id}.pdf`,
                                content: Buffer.from(receiptBuffer),
                                contentType: "application/pdf",
                                contentDisposition: "attachment"
                            }
                        ];
                    }
                } else if (log.type === "registration" && !html) {
                    let regUser = null;
                    if (log.relatedId && mongoose.Types.ObjectId.isValid(log.relatedId)) {
                        regUser = await User.findById(log.relatedId);
                    }
                    html = buildFallbackRegistrationHtml(regUser, log.to);
                }

                const info = await transporter.sendMail({
                    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
                    to: log.to,
                    subject: log.subject,
                    text: log.body,
                    ...(html ? { html } : {}),
                    attachments
                });

                log.status = "sent";
                log.providerMessageId = info.messageId;
                log.errorMessage = null;
                log.sentAt = new Date();
                await log.save();

                deliveredCount += 1;
                console.log(`[EmailRelay] Delivered queued ${log.type} email to ${log.to}`);
            } catch (err) {
                // Revert status to failed so it can be retried later
                log.status = "failed";
                log.errorMessage = err.message;
                await log.save();
                console.warn(`[EmailRelay] Could not relay email to ${log.to}:`, err.message);
                break;
            }
        }

        return deliveredCount;
    } finally {
        isFlushing = false;
    }
};

let relayTimer = null;

const startEmailRelayWorker = () => {
    if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "production") {
        return;
    }

    if (relayTimer) {
        return;
    }

    // Flush immediately on startup and then poll every 4 seconds
    flushFailedEmails().catch(() => {});
    relayTimer = setInterval(() => {
        flushFailedEmails().catch(() => {});
    }, 4000);
};

module.exports = {
    flushFailedEmails,
    startEmailRelayWorker
};

