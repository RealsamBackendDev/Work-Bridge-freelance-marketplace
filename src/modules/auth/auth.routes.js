const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("./auth.controller");
const validate = require("../../middleware/validate");
const { authenticate } = require("../../middleware/authenticate");
const { authorize } = require("../../middleware/authorize");
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  submitKycSchema,
  reviewKycSchema,
} = require("./auth.validator");

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again in 15 minutes.",
    data: null,
  },
});

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.post("/resend-verification", authLimiter, validate(resendOtpSchema), authController.resendVerification);
router.post("/submit-kyc", authenticate, authorize("FREELANCER"), validate(submitKycSchema), authController.submitKyc);
router.post("/admin/kyc/:userId/review", authenticate, authorize("ADMIN"), validate(reviewKycSchema), authController.reviewKyc);

module.exports = router;