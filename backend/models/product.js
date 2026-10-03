const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            maxlength: [150, "Product name cannot exceed 150 characters"]
        },

        brand: {
            type: String,
            required: [true, "Brand is required"],
            trim: true
        },

        movement: {
            type: String,
            required: [true, "Movement is required"],
            enum: {
                values: ["automatic", "quartz", "manual"],
                message: "Movement must be automatic, quartz, or manual"
            }
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

        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"]
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true
        },

        images: [
            {
                public_id: {
                    type: String,
                    required: true
                },
                url: {
                    type: String,
                    required: true
                }
            }
        ],

        stock: {
            type: Number,
            required: [true, "Stock is required"],
            min: [0, "Stock cannot be negative"],
            default: 0
        },

        isActive: {
            type: Boolean,
            default: true
        },

        ratings: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        numOfReviews: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

productSchema.pre("validate", function (next) {
    if (
        this.condition === "second-hand" &&
        ![0, 1].includes(this.stock)
    ) {
        this.invalidate(
            "stock",
            "Second-hand products can only have zero or one unit in stock"
        );
    }

    next();
});

productSchema.index({
    brand: 1,
    movement: 1,
    condition: 1,
    price: 1,
    isActive: 1
});

module.exports = mongoose.model("Product", productSchema);