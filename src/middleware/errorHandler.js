const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const { sendError } = require("../utils/sendResponse");

module.exports = (err, req, res, next) => {
  
  if (err.code === "P2002") {
    const field = (err.meta && err.meta.target && err.meta.target[0]) || "field";
    return sendError(res, 409, `A record with this ${field} already exists`);
  }
 
  if (err.code === "P2025") return sendError(res, 404, "Record not found");

  if (err instanceof ApiError) return sendError(res, err.statusCode, err.message);

  if (env.NODE_ENV !== "production") console.error(err);
  return sendError(res, 500, "Something went wrong. Please try again.");
};