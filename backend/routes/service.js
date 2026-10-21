const express = require("express");

const {
    getServices,
    getService,
    createService,
    updateService,
    deleteService,
    bulkDeleteServices
} = require("../controllers/serviceController");

const {
    isAuthenticatedUser,
    authorizeRoles
} = require("../middlewares/auth");

const router = express.Router();

// FR 5.1: the services are public.
router.get("/services", getServices);
router.get("/service/:id", getService);

// Only an admin manages the services.
router.post("/admin/service/new", isAuthenticatedUser, authorizeRoles("admin"), createService);
router.put("/admin/service/:id", isAuthenticatedUser, authorizeRoles("admin"), updateService);
router.delete("/admin/service/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteService);
router.post("/admin/services/bulk-delete", isAuthenticatedUser, authorizeRoles("admin"), bulkDeleteServices);

module.exports = router;
