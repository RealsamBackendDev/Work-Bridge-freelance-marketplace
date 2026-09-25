const { z } = require("zod");

exports.projectIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

exports.listProjectsSchema = z.object({
  query: z.object({
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});