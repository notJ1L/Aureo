const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", "config", ".env")
});

const { connectDB } = require("../config/db");
const User = require("../models/user");
const Product = require("../models/product");
const Service = require("../models/service");
const Order = require("../models/order");
const Ticket = require("../models/ticket");
const Appraisal = require("../models/appraisal");
const Review = require("../models/review");
const ChatHistory = require("../models/chatHistory");
const EmailLog = require("../models/emailLog");
const { sampleProducts, sampleServices } = require("./seedData");

const seedDatabase = async () => {
    try {
        console.log("Connecting to database...");
        await connectDB();

        console.log("----------------------------------------------------");
        console.log(" Wiping test data for a clean database state...");
        console.log("----------------------------------------------------");

        // 1. Clear test transactional data
        await Promise.all([
            Order.deleteMany({}),
            Ticket.deleteMany({}),
            Appraisal.deleteMany({}),
            Review.deleteMany({}),
            ChatHistory.deleteMany({}),
            EmailLog.deleteMany({})
        ]);
        console.log(" Cleared Orders, Tickets, Appraisals, Reviews, ChatHistory, and EmailLogs.");

        // 2. Setup Default Accounts
        const adminEmail = (process.env.ADMIN_EMAIL || "aureo.officialadmin@gmail.com").trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD || "aureoadmin";
        const userEmail = (process.env.USER_EMAIL || "user@aureo.com").trim().toLowerCase();
        const userPassword = process.env.USER_PASSWORD || "aureouser123";

        // Remove any other user accounts
        await User.deleteMany({
            email: { $nin: [adminEmail, userEmail] }
        });

        // Upsert Admin
        let admin = await User.findOne({ email: adminEmail }).select("+password");
        if (!admin) {
            admin = await User.create({
                name: "Aureo Administrator",
                email: adminEmail,
                password: adminPassword,
                role: "admin",
                authSource: "local",
                isVerified: true,
                isActive: true
            });
            console.log(" Admin account created:", adminEmail);
        } else {
            admin.name = "Aureo Administrator";
            admin.password = adminPassword;
            admin.role = "admin";
            admin.authSource = "local";
            admin.isVerified = true;
            admin.isActive = true;
            await admin.save();
            console.log(" Admin account reset:", adminEmail);
        }

        // Upsert Default Collector User
        let user = await User.findOne({ email: userEmail }).select("+password");
        if (!user) {
            user = await User.create({
                name: "Aureo Collector",
                email: userEmail,
                password: userPassword,
                role: "user",
                authSource: "local",
                isVerified: true,
                isActive: true,
                address: "123 Luxury Lane, Makati City, Metro Manila",
                contactNumber: "+639171234567"
            });
            console.log(" Collector account created:", userEmail);
        } else {
            user.name = "Aureo Collector";
            user.password = userPassword;
            user.role = "user";
            user.authSource = "local";
            user.isVerified = true;
            user.isActive = true;
            user.address = "123 Luxury Lane, Makati City, Metro Manila";
            user.contactNumber = "+639171234567";
            await user.save();
            console.log(" Collector account reset:", userEmail);
        }

        // 3. Clean and reseed Products
        await Product.deleteMany({});
        const insertedProducts = await Product.insertMany(sampleProducts);
        console.log(` Seeded ${insertedProducts.length} curated luxury timepieces.`);

        // 4. Clean and reseed Services
        await Service.deleteMany({});
        const insertedServices = await Service.insertMany(sampleServices);
        console.log(` Seeded ${insertedServices.length} master watchmaker services.`);

        // 5. Seed sample reviews for the first 3 products
        if (insertedProducts.length >= 3 && user) {
            const sampleReviews = [
                {
                    user: user._id,
                    product: insertedProducts[0]._id,
                    rating: 5,
                    comment: "Exceptional craftsmanship. The dial finish and sunray pattern exceed expectations. Impeccable packaging by Aureo."
                },
                {
                    user: user._id,
                    product: insertedProducts[1]._id,
                    rating: 5,
                    comment: "The gilt accents and snowflake hands on this timepiece are stunning. Arrived in pristine condition with authentic papers."
                },
                {
                    user: user._id,
                    product: insertedProducts[2]._id,
                    rating: 4,
                    comment: "Superb daily wearer. The movement accuracy is well within chronometer standards. Very satisfied with the vault service."
                }
            ];
            await Review.insertMany(sampleReviews);
            console.log(` Seeded ${sampleReviews.length} sample reviews.`);
        }

        console.log("----------------------------------------------------");
        console.log(" Database successfully reseeded to a pristine state!");
        console.log(" Admin Credentials:     ", adminEmail, "/", adminPassword);
        console.log(" User Credentials:      ", userEmail, "/", userPassword);
        console.log("----------------------------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
};

seedDatabase();
