const { Router } = require("express");
const { authenticate } = require("../../middleware/authenticate");
const messageService = require("./message.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

const router = Router();

router.get("/conversations", authenticate, catchAsync(async (req, res) => {
  const result = await messageService.listConversations({ userId: req.user.id });
  sendResponse(res, 200, "Conversations retrieved successfully", result);
}));

router.get("/conversations/:id/messages", authenticate, catchAsync(async (req, res) => {
  const result = await messageService.listMessages({
    conversationId: req.params.id,
    userId: req.user.id,
    page: Number(req.query.page) || 1,
    limit: Math.min(Number(req.query.limit) || 50, 100),
  });
  sendResponse(res, 200, "Messages retrieved successfully", result);
}));

router.post("/conversations/:id/messages", authenticate, catchAsync(async (req, res) => {
  const attachments = Array.isArray(req.body.attachments) ? req.body.attachments.slice(0, 5) : [];
  if (!req.body.body?.trim() && attachments.length === 0) {
    return res.status(400).json({ success: false, message: "Type a message or attach a file", data: null });
  }
  const result = await messageService.createMessage({
    conversationId: req.params.id,
    senderId: req.user.id,
    body: req.body.body?.trim() || "",
    attachments,
  });
  sendResponse(res, 201, "Message sent", result);
}));

router.post("/conversations/:id/read", authenticate, catchAsync(async (req, res) => {
  const result = await messageService.markRead({ conversationId: req.params.id, userId: req.user.id });
  sendResponse(res, 200, "Conversation marked as read", result);
}));

module.exports = router;