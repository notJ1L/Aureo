const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", "config", ".env")
});

const { connectDB } = require("../config/db");
const User = require("../models/user");
const Product = require("../models/product");
const Service = require("../models/service");
const { sampleProducts, sampleServices } = require("./seedData");

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
            await User.create({
                name: "Aureo Administrator",
                email: normalizedEmail,
                password: adminPassword,
                role: "admin",
                authSource: "local",
                isVerified: true
            });

            console.log("Admin account created");
        } else {
            admin.name = "Aureo Administrator";
            admin.password = adminPassword;
            admin.role = "admin";
            admin.authSource = "local";
            admin.isVerified = true;
            await admin.save();

            console.log("Admin account updated and password reset");
        }

        const userEmail = (process.env.USER_EMAIL || "user@aureo.com").trim().toLowerCase();
        const userPassword = process.env.USER_PASSWORD || "aureouser123";

        let user = await User.findOne({
            email: userEmail
        }).select("+password");

        if (!user) {
            await User.create({
                name: "Aureo Collector",
                email: userEmail,
                password: userPassword,
                role: "user",
                authSource: "local",
                isVerified: true,
                address: "123 Luxury Lane, Makati City, Metro Manila",
                contactNumber: "+639171234567"
            });

            console.log("User account created");
        } else {
            user.name = "Aureo Collector";
            user.password = userPassword;
            user.role = "user";
            user.authSource = "local";
            user.isVerified = true;
            user.address = user.address || "123 Luxury Lane, Makati City, Metro Manila";
            user.contactNumber = user.contactNumber || "+639171234567";
            await user.save();

            console.log("User account updated and password reset");
        }

        for (const product of sampleProducts) {
            await Product.findOneAndUpdate(
                {
                    name: product.name,
                    brand: product.brand
                },
                product,
                {
                    upsert: true,
                    returnDocument: "after",
                    setDefaultsOnInsert: true
                }
            );
        }

        for (const service of sampleServices) {
            await Service.findOneAndUpdate(
                {
                    name: service.name
                },
                service,
                {
                    upsert: true,
                    returnDocument: "after",
                    setDefaultsOnInsert: true
                }
            );
        }

        console.log(`Seeded ${sampleProducts.length} products and ${sampleServices.length} services`);
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
};

seedAdmin();
