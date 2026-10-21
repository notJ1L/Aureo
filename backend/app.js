const express = require("express"); //load nito ung express
const cors = require("cors"); //cors pang communicate ni vite kay backend
const errorMiddleware = require("./middlewares/error"); //pang handle ng error natin
const ErrorHandler = require("./utils/ErrorHandler"); //pang create ng custom error natin
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const reviewRoutes = require("./routes/review");
const appraisalRoutes = require("./routes/appraisal");
const serviceRoutes = require("./routes/service");
const ticketRoutes = require("./routes/ticket");
const dashboardRoutes = require("./routes/dashboard");
const chatRoutes = require("./routes/chat");

const app = express(); //gawa ka ng express app

// CORS allows only the configured frontend origins. CLIENT_URL holds one
// origin during local development and can hold a comma separated list of
// origins once the app is deployed (local Vite + Render frontend).
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Requests without an Origin header are same-origin or server
            // to server calls (curl, health checks).
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new ErrorHandler(
                    `Origin ${origin} is not allowed by the Aureo API`,
                    403
                )
            );
        },
        credentials: true
    })
);

app.use(express.json({ limit: "50mb" })); //para sa JSON data and base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" })); //para sa form data

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", reviewRoutes);
app.use("/api/v1", appraisalRoutes);
app.use("/api/v1", serviceRoutes);
app.use("/api/v1", ticketRoutes);
app.use("/api/v1", dashboardRoutes);
app.use("/api/v1", chatRoutes);
app.use((req, res, next) => {
    next(new ErrorHandler(`Route not found: ${req.originalUrl}`, 404));
});

app.use(errorMiddleware);

module.exports = app;
