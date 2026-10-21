const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"]
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },

        // Passwords are owned by the identity provider (Supabase) for provider
        // accounts, so it is only required for locally seeded accounts.
        password: {
            type: String,
            required: false,
            minlength: [8, "Password must be at least 8 characters"],
            select: false
        },

        authSource: {
            type: String,
            enum: ["local", "supabase", "google"],
            default: "local"
        },

        contactNumber: {
            type: String,
            trim: true,
            default: ""
        },

        address: {
            type: String,
            trim: true,
            default: ""
        },

        avatar: {
            public_id: {
                type: String,
                default: ""
            },
            url: {
                type: String,
                default: ""
            }
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        // Fallback verification code. Supabase is the primary sender of the
        // verification message, this guarantees the flow always completes.
        verificationCodeHash: {
            type: String,
            select: false,
            default: null
        },

        verificationCodeExpiresAt: {
            type: Date,
            select: false,
            default: null
        },

        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ],

        googleId: {
            type: String,
            default: null,
            select: false
        },

        supabaseUserId: {
            type: String,
            default: null,
            select: false
        }
    },
    {
        timestamps: true
    }
);

userSchema.pre("validate", function () {
    // Only locally managed accounts (the seeded administrator) keep a password.
    if (this.authSource === "local" && !this.password) {
        this.invalidate("password", "Password is required");
    }
});

userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);