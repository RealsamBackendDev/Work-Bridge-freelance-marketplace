const { z } = require("zod");

exports.createMilestoneSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  body: z.object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10).max(2000),
    amount: z.number().min(1),
    dueDate: z.coerce.date(),
  }),
});

exports.updateMilestoneSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    amount: z.number().min(1).optional(),
    dueDate: z.coerce.date().optional(),
  }),
});

exports.submitSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    submission: z.string().trim().min(10).max(3000),
    attachments: z.array(z.string().url()).max(5).optional(),
  }),
});

exports.rejectSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    reason: z.string().trim().min(5).max(1000),
  }),
});

exports.milestoneIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

exports.listMilestonesSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
});