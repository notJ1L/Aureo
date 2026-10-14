const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", "config", ".env")
});

const { connectDB } = require("../config/db");
const User = require("../models/user");

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            throw new Error(
                "ADMIN_EMAIL and ADMIN_PASSWORD are required"
            );
        }

        const normalizedEmail = adminEmail.trim().toLowerCase();

        let admin = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!admin) {
            admin = await User.create({
                name: "Aureo Administrator",
                email: normalizedEmail,
                password: adminPassword,
                role: "admin",
                isVerified: true
            });

            console.log("Admin account created");
        } else {
            admin.role = "admin";
            admin.isVerified = true;
            await admin.save();

            console.log("Admin account updated");
        }

        process.exit(0);
    } catch (error) {
        console.error("Admin seed failed:", error.message);
        process.exit(1);
    }
};

seedAdmin();