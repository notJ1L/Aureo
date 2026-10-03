const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number"
            }
        },

        comment: {
            type: String,
            required: [true, "Comment is required"],
            trim: true,
            maxlength: [1000, "Comment cannot exceed 1000 characters"]
        }
    },
    {
        timestamps: true
    }
);

reviewSchema.index(
    {
        user: 1,
        product: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model("Review", reviewSchema);