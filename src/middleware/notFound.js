const { sendError } = require("../utils/sendResponse");

module.exports = (req, res) =>
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);