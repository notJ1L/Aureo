const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
    {
        to: {
            type: String,
            required: [true, "Recipient email is required"],
            trim: true,
            lowercase: true
        },

        subject: {
            type: String,
            required: [true, "Email subject is required"],
            trim: true
        },

        body: {
            type: String,
            required: [true, "Email body is required"]
        },

        type: {
            type: String,
            enum: ["verification", "order", "ticket"],
            required: true
        },

        status: {
            type: String,
            enum: ["sent", "failed"],
            required: true
        },

        provider: {
            type: String,
            default: "smtp"
        },

        providerMessageId: {
            type: String,
            default: null
        },

        errorMessage: {
            type: String,
            default: null
        },

        relatedId: {
            type: String,
            default: null
        },

        sentAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

emailLogSchema.index({
    type: 1,
    sentAt: -1
});

module.exports = mongoose.model("EmailLog", emailLogSchema);