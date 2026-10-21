const express = require("express");

const {
    getProducts,
    getProduct,
    getAdminProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require("../controllers/productController");

const {
    isAuthenticatedUser,
    authorizeRoles
} = require("../middlewares/auth");

const router = express.Router();

router.get("/products", getProducts);
router.get("/product/:id", getProduct);

router.get("/wishlist", isAuthenticatedUser, getWishlist);
router.post("/wishlist/:productId", isAuthenticatedUser, addToWishlist);
router.delete("/wishlist/:productId", isAuthenticatedUser, removeFromWishlist);

router.get("/admin/products", isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);
router.post("/admin/product/new", isAuthenticatedUser, authorizeRoles("admin"), createProduct);
router.put("/admin/product/:id", isAuthenticatedUser, authorizeRoles("admin"), updateProduct);
router.delete("/admin/product/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

module.exports = router;