const mongoose = require("mongoose");
const dns = require("dns");

// Force Node.js to use Google DNS directly — fixes querySrv ECONNREFUSED
// caused by Windows system DNS resolver not forwarding SRV queries correctly.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = { connectDB };