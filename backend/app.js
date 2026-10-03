import express from "express"
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.get("/api/notes", (req, res) => {
    res.send("you got the 40 notes");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})