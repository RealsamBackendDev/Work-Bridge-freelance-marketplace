const { z } = require("zod");

exports.registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email("Provide a valid email").toLowerCase().trim(),
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