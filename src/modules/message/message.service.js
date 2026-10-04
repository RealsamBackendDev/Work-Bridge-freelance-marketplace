const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const { getIo } = require("../../config/socket");

const publicMessage = (m, viewerId) => ({
  id: m.id,
  conversationId: m.conversationId,
  body: m.body,
  senderId: m.senderId,
  mine: m.senderId === viewerId,
  readAt: m.readAt,
  createdAt: m.createdAt,
});

const getParticipantConversation = async (conversationId, userId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      client: { select: { id: true, name: true } },
      freelancer: { select: { id: true, name: true } },
    },
  });
  if (!conversation) throw new ApiError(404, "Conversation not found");
  if (conversation.clientId !== userId && conversation.freelancerId !== userId) {
    throw new ApiError(403, "You are not a participant in this conversation");
  }
  return conversation;
};

exports.createMessage = async ({ conversationId, senderId, body, viaSocket = false }) => {
  const conversation = await getParticipantConversation(conversationId, senderId);
  const message = await prisma.message.create({
    data: { conversationId, senderId, body },
  });

  const io = getIo();
  if (io) {
    const payload = { message: publicMessage(message, conversation.clientId) };
    io.to(`user:${conversation.clientId}`).to(`user:${conversation.freelancerId}`).emit("message:new", payload);
  }
  return { message: publicMessage(message, senderId) };
};

exports.listConversations = async ({ userId }) => {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ clientId: userId }, { freelancerId: userId }] },
    include: {
      client: { select: { id: true, name: true } },
      freelancer: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const ids = conversations.map((c) => c.id);
  const unread = await prisma.message.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: ids }, readAt: null, senderId: { not: userId } },
    _count: true,
  });
  const unreadMap = Object.fromEntries(unread.map((u) => [u.conversationId, u._count]));

  return {
    conversations: conversations.map((c) => ({
      id: c.id,
      project: c.project,
      otherParty: c.clientId === userId ? c.freelancer : c.client,
      lastMessage: c.messages[0] ? c.messages[0].body : null,
      lastMessageAt: c.messages[0] ? c.messages[0].createdAt : null,
      unreadCount: unreadMap[c.id] || 0,
    })),
    totalUnread: Object.values(unreadMap).reduce((a, b) => a + b, 0),
  };
};

exports.listMessages = async ({ conversationId, userId, page, limit }) => {
  await getParticipantConversation(conversationId, userId);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return {
    messages: messages.map((m) => publicMessage(m, userId)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

exports.markRead = async ({ conversationId, userId }) => {
  await getParticipantConversation(conversationId, userId);
  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
  return { read: true };
};