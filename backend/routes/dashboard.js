const express = require("express");

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const { getDashboard, getMockEmails } = require("../controllers/dashboardController");

const router = express.Router();

// FR 4.4: the dashboard is an admin only view.
router.get("/admin/dashboard", isAuthenticatedUser, authorizeRoles("admin"), getDashboard);
router.get("/admin/mock-emails", isAuthenticatedUser, authorizeRoles("admin"), getMockEmails);

module.exports = router;

