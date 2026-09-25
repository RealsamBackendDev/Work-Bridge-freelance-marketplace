const { z } = require("zod");

exports.registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email("Provide a valid email").toLowerCase().trim(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{7,14}$/, "Provide a valid phone number (E.164 format, e.g. +2348012345678)"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    role: z.enum(["CLIENT", "FREELANCER"]),
  }),
});

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1, "Password is required"),
  }),
});

exports.verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
    code: z.string().regex(/^\d{6}$/, "Verification code must be 6 digits"),
  }),
});

exports.resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase().trim(),
  }),
});

exports.submitKycSchema = z.object({
  body: z.object({
    documentType: z.enum(["NIN", "PASSPORT"]),
    documentNumber: z.string().trim().min(5).max(20),
    documentImage: z.string().url().optional(), 
  }),
});

exports.reviewKycSchema = z.object({
  params: z.object({ userId: z.string().min(1) }),
  body: z.object({
    action: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().max(500).optional(),
  }),
});