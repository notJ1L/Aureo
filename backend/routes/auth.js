const express = require("express");

const {
    registerUser,
    verifyEmail,
    loginUser,
    getCurrentUser,
    logoutUser
} = require("../controllers/authController");

const {
    isAuthenticatedUser
} = require("../middlewares/auth");

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", loginUser);

router.get(
    "/me",
    isAuthenticatedUser,
    getCurrentUser
);

router.get(
    "/logout",
    isAuthenticatedUser,
    logoutUser
);

module.exports = router;