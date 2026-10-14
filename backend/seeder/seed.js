const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.join(__dirname, "..", "config", ".env")
});

const { connectDB } = require("../config/db");
const User = require("../models/user");
const Product = require("../models/product");
const Service = require("../models/service");

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
                isVerified: true
            });

            console.log("Admin account created");
        } else {
            admin.role = "admin";
            admin.isVerified = true;
            await admin.save();

            console.log("Admin account updated");
        }

        const sampleProducts = [
            {
                name: "Presage Cocktail Time",
                brand: "Seiko",
                category: "dress",
                movement: "automatic",
                caseSize: 40,
                condition: "new",
                price: 28500,
                description: "A refined automatic watch with a textured dial.",
                images: [
                    {
                        public_id: "placeholder-seiko",
                        url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d"
                    }
                ],
                stock: 8,
                isActive: true,
                ratings: 4.5,
                numOfReviews: 12
            },
            {
                name: "Black Bay 58",
                brand: "Tudor",
                category: "diver",
                movement: "automatic",
                caseSize: 39,
                condition: "new",
                price: 148000,
                description: "A compact dive watch inspired by Tudor heritage.",
                images: [
                    {
                        public_id: "placeholder-tudor",
                        url: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8"
                    }
                ],
                stock: 3,
                isActive: true,
                ratings: 4.9,
                numOfReviews: 21
            }
        ];

        const sampleServices = [
            {
                name: "Watch Cleaning",
                description: "Exterior cleaning and inspection.",
                price: 1500
            },
            {
                name: "Movement Adjustment",
                description: "Timing inspection and adjustment.",
                price: 3500
            }
        ];

        for (const product of sampleProducts) {
            await Product.findOneAndUpdate(
                {
                    name: product.name,
                    brand: product.brand
                },
                product,
                {
                    upsert: true,
                    new: true,
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
                    new: true,
                    setDefaultsOnInsert: true
                }
            );
        }

        console.log("Sample products and services seeded");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
};

seedAdmin();