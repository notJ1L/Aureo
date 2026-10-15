const express = require("express");

const {
    createOrder,
    getMyOrders,
    getSingleOrder,
    cancelOrder,
    getAdminOrders,
    updateAdminOrder,
    deleteAdminOrder
} = require("../controllers/orderController");

const {
    isAuthenticatedUser,
    authorizeRoles,
    requireVerified
} = require("../middlewares/auth");

const router = express.Router();

// User orders
router.post("/order/new", isAuthenticatedUser, requireVerified, createOrder);
router.get("/orders/me", isAuthenticatedUser, getMyOrders);
router.get("/order/:id", isAuthenticatedUser, getSingleOrder);
router.put("/order/:id/cancel", isAuthenticatedUser, cancelOrder);

// Admin orders
router.get("/admin/orders", isAuthenticatedUser, authorizeRoles("admin"), getAdminOrders);
router.put("/admin/order/:id", isAuthenticatedUser, authorizeRoles("admin"), updateAdminOrder);
router.delete("/admin/order/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteAdminOrder);

module.exports = router;
