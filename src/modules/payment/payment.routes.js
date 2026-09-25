const { Router } = require("express");
const paymentController = require("./payment.controller");
const { authenticate } = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");
const { topupSchema, listTransactionsSchema } = require("./payment.validator");

const router = Router();

router.post("/wallet/topup", authenticate, validate(topupSchema), paymentController.topup);
router.get("/wallet", authenticate, paymentController.getBalance);
router.get("/transactions/my", authenticate, validate(listTransactionsSchema), paymentController.listMyTransactions);

module.exports = router;