const { z } = require("zod");

const categoryEnum = z.enum([
  "WEB_DEVELOPMENT",
  "MOBILE_DEVELOPMENT",
  "DESIGN",
  "WRITING",
  "MARKETING",
  "DATA",
  "OTHER",
]);

exports.createJobSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(5).max(150),
      description: z.string().trim().min(20).max(5000),
      category: categoryEnum,
      skillsRequired: z.array(z.string().trim().min(1).max(50)).max(15).optional(),
      budgetMin: z.number().min(1),
      budgetMax: z.number().min(1),
      deadline: z.coerce.date().optional(),
    })
    .refine((d) => d.budgetMax >= d.budgetMin, {
      message: "budgetMax must be greater than or equal to budgetMin",
      path: ["budgetMax"],
    }),
});

exports.updateJobSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().trim().min(5).max(150).optional(),
    description: z.string().trim().min(20).max(5000).optional(),
    category: categoryEnum.optional(),
    skillsRequired: z.array(z.string().trim().min(1).max(50)).max(15).optional(),
    budgetMin: z.number().min(1).optional(),
    budgetMax: z.number().min(1).optional(),
    deadline: z.coerce.date().nullable().optional(),
  }),
});

exports.jobIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

exports.listJobsSchema = z.object({
  query: z.object({
    search: z.string().trim().max(200).optional(),
    category: categoryEnum.optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});