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

exports.withdraw = async ({ userId, amount, bankName, accountNumber }) => {
  if (amount < 1000) throw new ApiError(400, "Minimum withdrawal is ₦1,000");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || Number(user.balance) < amount) {
    throw new ApiError(402, "Insufficient balance");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });
    await tx.withdrawal.create({
      data: { userId, amount, bankName, accountNumber },
    });
    await tx.transaction.create({
      data: {
        projectId: "withdrawal",
        fromUserId: userId,
        toUserId: userId,
        amount,
        type: "WITHDRAWAL",
      },
    });
    return updated;
  });

  return { balance: toMoney(result.balance) };
};

exports.listWithdrawals = async ({ userId }) => {
  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return { withdrawals };
};