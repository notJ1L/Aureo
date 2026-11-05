const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config/.env") });
const { connectDB } = require("./config/db");
const { startEmailRelayWorker } = require("./utils/emailRelay");

const runWorker = async () => {
    try {
        await connectDB();
        console.log("====================================================");
        console.log(" Aureo Email Relay Worker Active");
        console.log(" Polling MongoDB Atlas every 4s for pending emails...");
        console.log("====================================================");
        startEmailRelayWorker();
    } catch (error) {
        console.error("Failed to start email relay worker:", error.message);
        process.exit(1);
    }
};

runWorker();

