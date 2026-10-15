const express = require("express");

const {
    registerUser,
    verifyEmail,
    loginUser,
    googleLogin,
    getCurrentUser,
    logoutUser,
    updateProfile,
    uploadAvatar
} = require("../controllers/authController");

const {
    isAuthenticatedUser,
    requireVerified
} = require("../middlewares/auth");

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", loginUser);
router.post("/auth/google", googleLogin);

// Protected
router.get("/me", isAuthenticatedUser, getCurrentUser);
router.get("/logout", isAuthenticatedUser, logoutUser);
router.put("/me/update", isAuthenticatedUser, requireVerified, updateProfile);
router.put("/me/avatar", isAuthenticatedUser, uploadAvatar);

module.exports = router;