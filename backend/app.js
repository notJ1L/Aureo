const express = require("express"); //load nito ung express
const cors = require("cors"); //cors pang communicate ni vite kay backend
const errorMiddleware = require("./middlewares/error"); //pang handle ng error natin
const ErrorHandler = require("./utils/ErrorHandler"); //pang create ng custom error natin
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");
const reviewRoutes = require("./routes/review");

const app = express(); //gawa ka ng express app

//nag allow lang ng request mula sa frontend address na ito
app.use(
    cors({
        origin: "http://localhost:5173" //frontend adrress ito
    })
);

app.use(express.json({ limit: "50mb" })); //para sa JSON data and base64 images
app.use(express.urlencoded({ extended: true, limit: "50mb" })); //para sa form data

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", productRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", reviewRoutes);
app.use((req, res, next) => {
    next(new ErrorHandler(`Route not found: ${req.originalUrl}`, 404));
});

app.use(errorMiddleware);

module.exports = app;