const paymentService = require("./payment.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

exports.topup = catchAsync(async (req, res) => {
  const result = await paymentService.topup({ userId: req.user.id, amount: req.body.amount });
  sendResponse(res, 200, "Wallet topped up (simulated)", result);
});

exports.getBalance = catchAsync(async (req, res) => {
  const result = await paymentService.getBalance({ userId: req.user.id });
  sendResponse(res, 200, "Balance retrieved successfully", result);
});

exports.listMyTransactions = catchAsync(async (req, res) => {
  const result = await paymentService.listMyTransactions({
    userId: req.user.id,
    page: req.query.page,
    limit: req.query.limit,
  });
  sendResponse(res, 200, "Transactions retrieved successfully", result);
});