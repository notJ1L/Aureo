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
    createUserByAdmin,
    updateUserByAdmin,
    updateUserRole,
    bulkDeleteUsers,
    deleteUser,
    permanentlyDeleteUser
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
router
    .route("/admin/users")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers)
    .post(isAuthenticatedUser, authorizeRoles("admin"), createUserByAdmin);

router.post("/admin/users/bulk-delete", isAuthenticatedUser, authorizeRoles("admin"), bulkDeleteUsers);

router
    .route("/admin/user/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserByAdmin)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

router.delete(
    "/admin/user/:id/hard",
    isAuthenticatedUser,
    authorizeRoles("admin"),
    permanentlyDeleteUser
);

module.exports = router;