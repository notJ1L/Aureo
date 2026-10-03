const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Service name is required"],
            trim: true,
            maxlength: [150, "Service name cannot exceed 150 characters"]
        },

        description: {
            type: String,
            required: [true, "Service description is required"],
            trim: true
        },

        price: {
            type: Number,
            required: [true, "Service price is required"],
            min: [0.01, "Service price must be greater than zero"]
        }
    },
    {
        timestamps: true
    }
);

serviceSchema.index({
    name: 1
});

module.exports = mongoose.model("Service", serviceSchema);