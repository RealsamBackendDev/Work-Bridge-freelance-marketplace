const prisma = require("../../config/prisma");

const toMoney = (d) => (d === null || d === undefined ? null : Number(d));

const publicTransaction = (t) => ({
  id: t.id,
  milestoneId: t.milestoneId,
  projectId: t.projectId,
  amount: toMoney(t.amount),
  type: t.type,
  status: t.status,
  direction: t.direction,
  counterparty: t.counterparty ? { id: t.counterparty.id, name: t.counterparty.name } : undefined,
  createdAt: t.createdAt,
});

exports.topup = async ({ userId, amount }) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { balance: { increment: amount } },
    select: { id: true, balance: true },
  });
  return { balance: toMoney(user.balance) };
};

exports.getBalance = async ({ userId }) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
  return { balance: toMoney(user.balance) };
};

exports.listMyTransactions = async ({ userId, page, limit }) => {
  const skip = (page - 1) * limit;
  const where = { OR: [{ fromUserId: userId }, { toUserId: userId }] };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  const shaped = transactions.map((t) =>
    publicTransaction({
      ...t,
      direction: t.fromUserId === userId ? "DEBIT" : "CREDIT",
      counterparty: t.fromUserId === userId ? t.toUser : t.fromUser,
    })
  );

  return {
    transactions: shaped,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};