const { z } = require("zod");

exports.topupSchema = z.object({
  body: z.object({
    amount: z.number().min(1).max(1000000),
  }),
});

exports.listTransactionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});