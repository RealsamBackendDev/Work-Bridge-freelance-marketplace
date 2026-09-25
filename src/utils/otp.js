const crypto = require("crypto");
const env = require("../config/env");

exports.generateOtp = () =>
  crypto.randomInt(100000, 999999).toString(); 

exports.hashOtp = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

exports.otpExpiry = () =>
  new Date(Date.now() + Number(env.OTP_EXPIRES_MINUTES) * 60 * 1000);