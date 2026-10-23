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
            },
            {
                name: "Datejust 36",
                brand: "Rolex",
                category: "dress",
                movement: "automatic",
                caseSize: 36,
                condition: "new",
                price: 265000,
                description: "A classic dress watch with a fluted bezel and a silver dial.",
                images: [
                    {
                        public_id: "placeholder-rolex",
                        url: "https://images.unsplash.com/photo-1547996160-81dfa63595aa"
                    }
                ],
                stock: 2,
                isActive: true,
                ratings: 4.8,
                numOfReviews: 9
            },
            {
                name: "Aquascape 200M",
                brand: "Grand Seiko",
                category: "diver",
                movement: "automatic",
                caseSize: 41,
                condition: "new",
                price: 118000,
                description: "A sharp diver with a textured dial and a 200m water resistance.",
                images: [
                    {
                        public_id: "placeholder-gs",
                        url: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3"
                    }
                ],
                stock: 5,
                isActive: true,
                ratings: 4.7,
                numOfReviews: 6
            },
            {
                name: "Speedmaster 386",
                brand: "Omega",
                category: "chronograph",
                movement: "manual",
                caseSize: 42,
                condition: "new",
                price: 196000,
                description: "A manual chronograph with a stepped dial and hesalite crystal.",
                images: [
                    {
                        public_id: "placeholder-omega",
                        url: "https://images.unsplash.com/photo-1594534475808-b18fc33b045e"
                    }
                ],
                stock: 4,
                isActive: true,
                ratings: 4.6,
                numOfReviews: 14
            },
            {
                name: "Calatrava Pre-Owned",
                brand: "Patek Philippe",
                category: "dress",
                movement: "manual",
                caseSize: 35,
                condition: "second-hand",
                price: 385000,
                description: "A pre-owned Calatrava with original papers and a 2019 service record.",
                images: [
                    {
                        public_id: "placeholder-calatrava",
                        url: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade"
                    }
                ],
                // FR 2.2: a second-hand watch is a single unit.
                stock: 1,
                isActive: true,
                ratings: 4.9,
                numOfReviews: 3
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

        console.log("Sample products and services seeded");
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
};

seedAdmin();