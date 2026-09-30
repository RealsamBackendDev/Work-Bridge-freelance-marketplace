const authService = require("./auth.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

const REFRESH_COOKIE = "workbridge_rt";

const cookieOptions = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

exports.register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  sendResponse(res, 201, "Account created successfully", result);
});

exports.login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  sendResponse(res, 200, "Logged in successfully", {
    user: result.user,
    accessToken: result.accessToken,
  });
});

exports.refresh = catchAsync(async (req, res) => {
  const token = req.cookies[REFRESH_COOKIE] || req.body.refreshToken;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Refresh token required", data: null });
  }

  const result = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
  sendResponse(res, 200, "Token refreshed", {
    user: result.user,
    accessToken: result.accessToken,
  });
});

exports.verifyEmail = catchAsync(async (req, res) => {
  const result = await authService.verifyEmail(req.body);
  sendResponse(res, 200, "Email verified successfully", result);
});

exports.resendVerification = catchAsync(async (req, res) => {
  const result = await authService.resendVerification(req.body);
  sendResponse(res, 200, "If the email is registered and unverified, a new code has been sent", result);
});

exports.submitKyc = catchAsync(async (req, res) => {
  const result = await authService.submitKyc({ userId: req.user.id, ...req.body });
  sendResponse(res, 200, "KYC submitted. It will be reviewed within 24 hours.", result);
});

exports.reviewKyc = catchAsync(async (req, res) => {
  const result = await authService.reviewKyc({ userId: req.params.userId, ...req.body });
  sendResponse(res, 200, `KYC ${req.body.action === "APPROVE" ? "approved" : "rejected"}`, result);
});

exports.logout = catchAsync(async (req, res) => {
  await authService.logout(req.cookies[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE);
  sendResponse(res, 200, "Logged out successfully", null);
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  sendResponse(res, 200, "If the email is registered, a reset code has been sent", result);
});

exports.resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  sendResponse(res, 200, "Password reset successfully. Log in with your new password.", result);
});