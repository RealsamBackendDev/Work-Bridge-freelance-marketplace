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
  forgotPasswordSchema,
  resetPasswordSchema,
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

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account (CLIENT or FREELANCER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, role]
 *             properties:
 *               name: { type: string, example: "Ada Lovelace" }
 *               email: { type: string, example: "ada@workbridge.dev" }
 *               phone: { type: string, example: "+2348012345678" }
 *               password: { type: string, example: "password123" }
 *               role: { type: string, enum: [CLIENT, FREELANCER] }
 *     responses:
 *       201: { description: Account created, verification OTP sent }
 *       400: { description: Validation error }
 *       409: { description: Email or phone already exists }
 */
router.post("/register", authLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in (requires verified email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "ada@workbridge.dev" }
 *               password: { type: string, example: "password123" }
 *     responses:
 *       200: { description: Returns accessToken, sets httpOnly refresh cookie }
 *       401: { description: Invalid credentials }
 *       403: { description: Email not verified or account deactivated }
 */
router.post("/login", authLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate tokens (uses workbridge_rt cookie)
 *     responses:
 *       200: { description: New accessToken and rotated refresh cookie }
 *       401: { description: Refresh token invalid, expired, or reused }
 */
router.post("/refresh", authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke refresh token and clear cookie
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with 6-digit OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, example: "ada@workbridge.dev" }
 *               code: { type: string, example: "483920" }
 *     responses:
 *       200: { description: Email verified }
 *       400: { description: Invalid, expired, or already-consumed code }
 */
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Request a new verification OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "ada@workbridge.dev" }
 *     responses:
 *       200: { description: OTP re-sent (or silent no-op if already verified) }
 *       429: { description: Too frequent — wait 1 minute }
 */
router.post("/resend-verification", authLimiter, validate(resendOtpSchema), authController.resendVerification);

/**
 * @openapi
 * /auth/submit-kyc:
 *   post:
 *     tags: [Auth]
 *     summary: Submit KYC documents (FREELANCER only, requires verified email)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentType, documentNumber]
 *             properties:
 *               documentType: { type: string, enum: [NIN, PASSPORT] }
 *               documentNumber: { type: string, example: "12345678901" }
 *               documentImage: { type: string, example: "https://res.cloudinary.com/..." }
 *     responses:
 *       200: { description: KYC under review }
 *       400: { description: Already pending/verified or email unverified }
 *       403: { description: Clients cannot submit KYC }
 */
router.post("/submit-kyc", authenticate, authorize("FREELANCER"), validate(submitKycSchema), authController.submitKyc);

/**
 * @openapi
 * /auth/admin/kyc/{userId}/review:
 *   post:
 *     tags: [Auth]
 *     summary: Approve or reject a freelancer KYC (ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [APPROVE, REJECT] }
 *               reason: { type: string }
 *     responses:
 *       200: { description: KYC reviewed }
 *       400: { description: No pending KYC }
 *       403: { description: Admin only }
 */

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
router.post("/admin/kyc/:userId/review", authenticate, authorize("ADMIN"), validate(reviewKycSchema), authController.reviewKyc);

module.exports = router;