const express = require("express");

const {
    registerUser,
    verifyEmail,
    loginUser,
    getCurrentUser,
    logoutUser,
    updateProfile
} = require("../controllers/authController");

const {
    isAuthenticatedUser
} = require("../middlewares/auth");

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", loginUser);
router.get("/me", isAuthenticatedUser, getCurrentUser);
router.get("/logout", isAuthenticatedUser, logoutUser);
router.put("/me/update", isAuthenticatedUser, updateProfile);

module.exports = router;