const EmailLog = require("../models/emailLog");

// FR 4.5 / FR 5.4: email notifications are mocked. Every notification is
// printed to the console and stored in the EmailLog collection so the admin
// can review it later.
const mockEmail = async ({
    to,
    subject,
    body,
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
            "────────────── AUREO MOCK EMAIL ──────────────",
            `To:       ${to}`,
            `Subject:  ${subject}`,
            `Type:     ${type}`,
            `Related:  ${relatedId || "n/a"}`,
            `Files:    ${attachmentNames.length ? attachmentNames.join(", ") : "none"}`,
            "────────────────────────────────────────────────",
            body,
            "────────────────────────────────────────────────",
            ""
        ].join("\n")
    );

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
