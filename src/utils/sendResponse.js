// One response shape for the entire API
exports.sendResponse = (res, statusCode, message, data = null) =>
  res.status(statusCode).json({ success: true, message, data });

exports.sendError = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, message, data: null });