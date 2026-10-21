const express = require("express");

const {
    createTicket,
    getMyTickets,
    getTicket,
    getAdminTickets,
    updateTicketStatus
} = require("../controllers/ticketController");

const {
    isAuthenticatedUser,
    authorizeRoles,
    requireVerified
} = require("../middlewares/auth");

const router = express.Router();

// FR 5.2: a verified user opens a ticket and follows their own tickets.
router.post("/ticket/new", isAuthenticatedUser, requireVerified, createTicket);
router.get("/tickets/me", isAuthenticatedUser, getMyTickets);
router.get("/ticket/:id", isAuthenticatedUser, getTicket);

// FR 5.3: the admin sees every ticket and updates the status.
router.get("/admin/tickets", isAuthenticatedUser, authorizeRoles("admin"), getAdminTickets);
router.put("/admin/ticket/:id", isAuthenticatedUser, authorizeRoles("admin"), updateTicketStatus);

module.exports = router;
