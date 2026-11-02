const EmailLog = require("../models/emailLog");
const sendEmail = require("./sendEmail");

// Sends real SMTP email when SMTP credentials are configured (outside test runs),
// and also logs the notification to the console + EmailLog collection.
const mockEmail = async ({
    to,
    subject,
    body,
    html,
    type,
    relatedId = null,
    attachments = []
}) => {
    const attachmentNames = attachments
        .map((attachment) => attachment.filename)
        .filter(Boolean);

    console.log(
        [
            "",
            "────────────── AUREO EMAIL DISPATCH ──────────────",
            `To:       ${to}`,
            `Subject:  ${subject}`,
            `Type:     ${type}`,
            `Related:  ${relatedId || "n/a"}`,
            `Files:    ${attachmentNames.length ? attachmentNames.join(", ") : "none"}`,
            "──────────────────────────────────────────────────",
            body,
            "──────────────────────────────────────────────────",
            ""
        ].join("\n")
    );

    const isSmtpConfigured = Boolean(
        process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASSWORD &&
            process.env.NODE_ENV !== "test"
    );

    if (isSmtpConfigured) {
        try {
            return await sendEmail({
                to,
                subject,
                text: body,
                html,
                type,
                relatedId,
                attachments
            });
        } catch (error) {
            console.error("SMTP email delivery failed:", error.message);
            // sendEmail already recorded the failed EmailLog entry; return gracefully
            return null;
        }
    }

    const record = await EmailLog.create({
        to,
        subject,
        body,
        type,
        status: "sent",
        provider: "mock",
        providerMessageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        relatedId,
        attachments: attachmentNames,
        sentAt: new Date()
    });

    return record;
};

module.exports = mockEmail;
