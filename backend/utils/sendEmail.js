const nodemailer = require("nodemailer");
const EmailLog = require("../models/emailLog");

const createSmtpTransporter = () =>
    nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        family: 4,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });

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
