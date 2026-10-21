const ChatHistory = require("../models/chatHistory");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const { extractPreferences, buildReply } = require("../utils/chatEngine");

// FR 7.1: the chat is only available for a signed in collector.
const chat = catchAsyncErrors(async (req, res, next) => {
    const { message } = req.body;

    if (!message || !String(message).trim()) {
        return next(new ErrorHandler("A message is required", 400));
    }

    let history = await ChatHistory.findOne({ user: req.user._id });

    if (!history) {
        history = await ChatHistory.create({
            user: req.user._id,
            messages: [],
            preferences: {}
        });
    }

    // FR 7.2: the preferences of the previous messages are kept and updated.
    const preferences = extractPreferences(message, history.preferences || {});
    const { reply, matches } = await buildReply(message, preferences);

    history.messages.push({ role: "user", content: String(message).trim() });
    history.messages.push({ role: "assistant", content: reply });
    history.preferences = preferences;

    await history.save();

    res.status(200).json({
        success: true,
        reply,
        matches,
        preferences
    });
});

// FR 7.2: a collector loads the previous conversation.
const getChatHistory = catchAsyncErrors(async (req, res) => {
    const history = await ChatHistory.findOne({ user: req.user._id });

    res.status(200).json({
        success: true,
        messages: history?.messages || [],
        preferences: history?.preferences || {}
    });
});

module.exports = { chat, getChatHistory };
