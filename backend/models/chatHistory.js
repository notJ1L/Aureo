const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },

        content: {
            type: String,
            required: true,
            trim: true
        },

        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: false
    }
);

const chatHistorySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        messages: {
            type: [messageSchema],
            default: []
        },

        preferences: {
            budget: {
                type: Number,
                default: null
            },

            style: {
                type: String,
                default: null,
                trim: true
            },

            brand: {
                type: String,
                default: null,
                trim: true
            },

            movement: {
                type: String,
                enum: ["automatic", "quartz", "manual", null],
                default: null
            }
        }
    },
    {
        timestamps: true
    }
);

chatHistorySchema.index({
    user: 1
});

module.exports = mongoose.model("ChatHistory", chatHistorySchema);