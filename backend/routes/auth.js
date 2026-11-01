const express = require("express");

const {
    registerUser,
    verifyEmail,
    loginUser,
    googleLogin,
    getCurrentUser,
    logoutUser,
    updateProfile,
    uploadAvatar,
    getAllUsers,
    getSingleUser,
    updateUserRole,
    deleteUser
} = require("../controllers/authController");

const {
    isAuthenticatedUser,
    authorizeRoles,
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

// Admin: User management (FR 1.4)
router.get("/admin/users", isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);
router
    .route("/admin/user/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;