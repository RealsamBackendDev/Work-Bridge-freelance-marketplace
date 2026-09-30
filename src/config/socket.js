const { Server } = require("socket.io");
const env = require("./env");
const { verifyAccessToken } = require("../utils/tokens");
const messageService = require("../modules/message/message.service");

let io;

exports.initSocket = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: env.CORS_ORIGIN, credentials: true } });

  io.use((socket, next) => {
    try {
      const payload = verifyAccessToken(socket.handshake.auth.token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on("message:send", async ({ conversationId, body }, ack) => {
      try {
        const { message } = await messageService.createMessage({
          conversationId,
          senderId: socket.userId,
          body,
          viaSocket: true,
        });
        if (typeof ack === "function") ack({ success: true, data: message });
      } catch (err) {
        if (typeof ack === "function") {
          ack({ success: false, message: err.message || "Failed to send message" });
        }
      }
    });
  });

  return io;
};

exports.getIo = () => io;