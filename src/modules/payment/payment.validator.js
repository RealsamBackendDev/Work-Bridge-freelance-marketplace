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

exports.withdrawSchema = z.object({
  body: z.object({
    amount: z.number().min(1000, "Minimum withdrawal is ₦1,000").max(10000000),
    bankName: z.string().trim().min(2).max(100),
    accountNumber: z.string().trim().min(8).max(20),
  }),
});