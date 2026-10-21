const nodemailer = require("nodemailer");
const EmailLog = require("../models/emailLog");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendEmail = async ({
    to,
    subject,
    text,
    type,
    relatedId = null,
    attachments = []
}) => {
    const attachmentNames = attachments
        .map((attachment) => attachment.filename)
        .filter(Boolean);

    try {
        const emailInfo = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text,
            attachments
        });

        await EmailLog.create({
            to,
            subject,
            body: text,
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
            body: text,
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