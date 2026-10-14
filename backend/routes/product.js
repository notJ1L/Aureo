const express = require("express");

const {
    getProducts,
    getProduct
} = require("../controllers/productController");

const router = express.Router();

router.get("/products", getProducts);
router.get("/product/:id", getProduct);

module.exports = router;