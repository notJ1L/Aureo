const dns = require("dns");
const nodemailer = require("nodemailer");
const EmailLog = require("../models/emailLog");

const customLookup = (hostname, options, callback) => {
    // Explicitly enforce IPv4 to prevent ENETUNREACH errors on cloud container hosts like Render
    dns.lookup(hostname, { family: 4 }, callback);
};

const createSmtpTransporter = () => {
    const isGmail =
        (process.env.SMTP_HOST && process.env.SMTP_HOST.includes("gmail")) ||
        (process.env.SMTP_USER && process.env.SMTP_USER.includes("@gmail.com"));

    if (isGmail) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            lookup: customLookup
        });
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        lookup: customLookup
    });
};

const sendEmail = async ({
    to,
    subject,
    text,
    body,
    html,
    type = "order",
    relatedId = null,
    attachments = []
}) => {
    const messageText = text || body || "";
    const attachmentNames = attachments
        .map((attachment) => attachment.filename)
        .filter(Boolean);

    const transporter = createSmtpTransporter();

    try {
        const emailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            text: messageText,
            ...(html ? { html } : {}),
            attachments
        });

        await EmailLog.create({
            to,
            subject,
            body: messageText,
            html: html || null,
            type,
            status: "sent",
            provider: "smtp",
            providerMessageId: emailInfo.messageId,
            relatedId,
            attachments: attachmentNames,
            sentAt: new Date()
        });

        return emailInfo;
    } catch (error) {
        console.error(`SMTP delivery failed to ${to}:`, error.message);

        await EmailLog.create({
            to,
            subject,
            body: messageText,
            html: html || null,
            type,
            status: "failed",
            provider: "smtp",
            errorMessage: error.message,
            relatedId,
            attachments: attachmentNames,
            sentAt: new Date()
        });

        throw error;
    }
};

module.exports = sendEmail;
module.exports.createSmtpTransporter = createSmtpTransporter;
