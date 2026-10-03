const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: [
                "Received",
                "Diagnosing",
                "Waiting for Parts",
                "Completed"
            ],
            required: true
        },

        changedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: false
    }
);

const ticketSchema = new mongoose.Schema(
    {
        ticketNumber: {
            type: String,
            required: [true, "Ticket number is required"],
            unique: true,
            trim: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            required: true
        },

        watchBrand: {
            type: String,
            required: [true, "Watch brand is required"],
            trim: true
        },

        watchModel: {
            type: String,
            required: [true, "Watch model is required"],
            trim: true
        },

        problemDescription: {
            type: String,
            required: [true, "Problem description is required"],
            trim: true,
            maxlength: [2000, "Problem description cannot exceed 2000 characters"]
        },

        status: {
            type: String,
            enum: [
                "Received",
                "Diagnosing",
                "Waiting for Parts",
                "Completed"
            ],
            default: "Received"
        },

        statusHistory: {
            type: [statusHistorySchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

ticketSchema.index({
    user: 1,
    createdAt: -1
});

module.exports = mongoose.model("Ticket", ticketSchema);