const { sendError } = require("../utils/sendResponse");

exports.authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return sendError(res, 403, `This action requires role: ${allowedRoles.join(" or ")}`);
  }
  next();
};