const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        image: {
            type: String,
            default: ""
        }
    },
    {
        _id: false
    }
);

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ["Pending", "Paid", "Shipped", "Completed", "Cancelled"],
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

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        orderItems: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (items) => items.length > 0,
                message: "An order must contain at least one item"
            }
        },

        shippingInfo: {
            address: {
                type: String,
                required: true,
                trim: true
            },

            city: {
                type: String,
                required: true,
                trim: true
            },

            postalCode: {
                type: String,
                required: true,
                trim: true
            },

            country: {
                type: String,
                required: true,
                trim: true,
                default: "Philippines"
            },

            phone: {
                type: String,
                required: true,
                trim: true
            }
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "Dummy Credit Card", "E-Wallet"],
            required: true
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending"
        },

        status: {
            type: String,
            enum: ["Pending", "Paid", "Shipped", "Completed", "Cancelled"],
            default: "Pending"
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

orderSchema.methods.calculateTotal = function () {
    return this.orderItems.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
};

orderSchema.index({
    user: 1,
    createdAt: -1
});

module.exports = mongoose.model("Order", orderSchema);