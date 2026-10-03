const mongoose = require("mongoose");

const appraisalPhotoSchema = new mongoose.Schema(
    {
        public_id: {
            type: String,
            required: true
        },

        url: {
            type: String,
            required: true
        }
    },
    {
        _id: false
    }
);

const appraisalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        brand: {
            type: String,
            required: [true, "Brand is required"],
            trim: true
        },

        model: {
            type: String,
            required: [true, "Model is required"],
            trim: true
        },

        movement: {
            type: String,
            required: [true, "Movement is required"],
            enum: ["automatic", "quartz", "manual"]
        },

        caseSize: {
            type: Number,
            required: [true, "Case size is required"],
            min: [1, "Case size must be greater than zero"]
        },

        condition: {
            type: String,
            required: [true, "Condition is required"],
            enum: ["new", "second-hand"]
        },

        year: {
            type: Number,
            required: [true, "Year is required"],
            min: [1800, "Year must be valid"]
        },

        hasBox: {
            type: Boolean,
            default: false
        },

        hasPapers: {
            type: Boolean,
            default: false
        },

        askingPrice: {
            type: Number,
            required: [true, "Asking price is required"],
            min: [0, "Asking price cannot be negative"]
        },

        photos: {
            type: [appraisalPhotoSchema],
            required: [true, "At least one photo is required"],
            validate: [
                {
                    validator: (photos) => photos.length >= 1,
                    message: "At least one photo is required"
                },
                {
                    validator: (photos) => photos.length <= 6,
                    message: "You can upload a maximum of six photos"
                }
            ]
        },

        status: {
            type: String,
            enum: ["Pending", "Offer Made", "Accepted", "Rejected"],
            default: "Pending"
        },

        offerPrice: {
            type: Number,
            min: [0, "Offer price cannot be negative"],
            default: null
        },

        convertedProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null
        }
    },
    {
        timestamps: true
    }
);

appraisalSchema.index({
    user: 1,
    createdAt: -1
});

module.exports = mongoose.model("Appraisal", appraisalSchema);