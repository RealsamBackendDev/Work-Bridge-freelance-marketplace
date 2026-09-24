const { verifyAccessToken } = require("../utils/tokens");
const { sendError } = require("../utils/sendResponse");
const prisma = require("../config/prisma");

exports.authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return sendError(res, 401, "Authentication required. Provide a Bearer token.");
  }

  try {
    const payload = verifyAccessToken(header.split(" ")[1]);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return sendError(res, 401, "Account not found or deactivated");
    }

    req.user = user;
    next();
  } catch {
    return sendError(res, 401, "Invalid or expired access token");
  }
};