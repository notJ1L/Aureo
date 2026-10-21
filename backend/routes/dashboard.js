const express = require("express");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { getDashboard } = require("../controllers/dashboardController");

const router = express.Router();

// FR 4.4: the dashboard is an admin only view.
router.get("/admin/dashboard", isAuthenticatedUser, authorizeRoles("admin"), getDashboard);

module.exports = router;
