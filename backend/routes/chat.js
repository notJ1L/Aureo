const express = require("express");

const { chat, getChatHistory } = require("../controllers/chatController");
const { isAuthenticatedUser } = require("../middlewares/auth");

const router = express.Router();

// FR 7.1 / FR 7.2: the assistant is only available for a signed in collector.
router.post("/chat", isAuthenticatedUser, chat);
router.get("/chat/history", isAuthenticatedUser, getChatHistory);

module.exports = router;
