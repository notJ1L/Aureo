const express = require("express"); //load nito ung express
const cors = require("cors"); //cors pang communicate ni vite kay backend

const app = express(); //gawa ka ng express app

//nag allow lang ng request mula sa frontend address na ito
app.use(
    cors({
        origin: "http://localhost:5173" //frontend adrress ito
    })
);

app.use(express.json()); //para sa JSON data
app.use(express.urlencoded({ extended: true })); //para sa form data

app.get("/api/v1/health", (req, res) => { //health check route
    res.status(200).json({
        success: true,
        message: "Aureo API is running"
    });
});

module.exports = app;