const { z } = require("zod");

const id = z.string().min(1);

exports.createProposalSchema = z.object({
  params: z.object({ jobId: id }),
  body: z.object({
    coverLetter: z.string().trim().min(20).max(3000),
    bidAmount: z.number().min(1),
    estimatedDays: z.number().int().min(1).max(365),
  }),
});

exports.updateProposalSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    coverLetter: z.string().trim().min(20).max(3000).optional(),
    bidAmount: z.number().min(1).optional(),
    estimatedDays: z.number().int().min(1).max(365).optional(),
  }),
});

exports.listJobProposalsSchema = z.object({
  params: z.object({ jobId: id }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

exports.myProposalsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

exports.proposalIdSchema = z.object({
  params: z.object({ id }),
});