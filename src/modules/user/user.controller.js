const userService = require("./user.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

exports.getMyProfile = catchAsync(async (req, res) => {
  const result = await userService.getMyProfile({ userId: req.user.id });
  sendResponse(res, 200, "Profile retrieved successfully", result);
});

exports.updateProfile = catchAsync(async (req, res) => {
  const result = await userService.updateProfile({ userId: req.user.id, update: req.body });
  sendResponse(res, 200, "Profile updated successfully", result);
});

exports.listPendingKyc = catchAsync(async (req, res) => {
  const result = await userService.listPendingKyc();
  sendResponse(res, 200, "Pending KYC submissions retrieved", result);
});