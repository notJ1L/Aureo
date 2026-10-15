const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "config", ".env") });

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { connectDB } = require("../config/db");
const User = require("../models/user");

const clearUsers = async () => {
    try {
        await connectDB();

        const result = await User.deleteMany({ role: { $ne: "admin" } });
        console.log(`Deleted ${result.deletedCount} non-admin users`);

        process.exit(0);
    } catch (error) {
        console.error("Clear failed:", error.message);
        process.exit(1);
    }
};

clearUsers();
