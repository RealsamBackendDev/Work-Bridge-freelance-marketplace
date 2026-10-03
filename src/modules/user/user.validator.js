const { z } = require("zod");

exports.updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(1000).optional(),
    location: z.string().trim().max(100).optional(),
    skills: z.array(z.string().trim().min(1).max(50)).max(15).optional(),
    hourlyRate: z.number().min(0).optional(),
    avatar: z.string().url().optional().or(z.literal("")),
  }),
});