const { Router } = require("express");
const paymentController = require("./payment.controller");
const { authenticate } = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");
const { authorize } = require("../../middleware/authorize");
const { topupSchema, listTransactionsSchema, withdrawSchema } = require("./payment.validator");

const router = Router();

router.post("/wallet/topup", authenticate, authorize("CLIENT"), validate(topupSchema), paymentController.topup);
router.get("/wallet", authenticate, paymentController.getBalance);
router.get("/transactions/my", authenticate, validate(listTransactionsSchema), paymentController.listMyTransactions);
router.post("/wallet/withdraw", authenticate, validate(withdrawSchema), paymentController.withdraw);
router.get("/withdrawals/my", authenticate, paymentController.listWithdrawals);

module.exports = router;