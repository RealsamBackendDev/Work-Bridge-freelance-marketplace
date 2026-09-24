const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");

exports.signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });

exports.signRefreshToken = (user) =>
  jwt.sign({ sub: user.id, tokenId: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });

exports.verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
exports.verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

// Refresh tokens are stored HASHED — a DB leak never exposes valid tokens
exports.hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");