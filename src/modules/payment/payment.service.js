const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");
const env = require("../../config/env");

const toMoney = (d) => (d === null || d === undefined ? null : Number(d));

const publicTransaction = (t, viewerId) => ({
  id: t.id,
  milestoneId: t.milestoneId,
  projectId: t.projectId,
  amount: toMoney(t.amount),
  type: t.type,
  status: t.status,
  direction:
    t.type === "WITHDRAWAL"
      ? "DEBIT"
      : t.type === "MILESTONE_PAYMENT" && t.fromUserId === viewerId
        ? "DEBIT"
        : "CREDIT",
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

exports.initializeFunding = async ({ userId, amount }) => {
  if (!env.PAYSTACK_SECRET_KEY) throw new ApiError(500, "Payment provider not configured");
  if (amount < 100) throw new ApiError(400, "Minimum funding is ₦100");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const reference = `WB-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: `${env.CORS_ORIGIN}/wallet`,
      metadata: { userId: user.id, amount },
    }),
  });

  const data = await paystackRes.json();
  if (!data.status) throw new ApiError(502, data.message || "Paystack initialization failed");

  await prisma.transaction.create({
    data: {
      fromUserId: userId,
      toUserId: userId,
      amount,
      type: "WALLET_FUNDING",
      status: "PENDING",
      reference,
    },
  });

  return { authorizationUrl: data.data.authorization_url, reference };
};

exports.verifyFunding = async ({ userId, reference }) => {
  const txn = await prisma.transaction.findUnique({ where: { reference } });
  if (!txn || txn.fromUserId !== userId) throw new ApiError(404, "Transaction not found");
  if (txn.status === "COMPLETED") return { status: "COMPLETED", already: true };

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!data.status) throw new ApiError(502, "Verification failed");

  if (data.data.status !== "success") {
    await prisma.transaction.update({ where: { id: txn.id }, data: { status: "FAILED" } });
    return { status: "FAILED" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: txn.amount } },
    });
    await tx.transaction.update({ where: { id: txn.id }, data: { status: "COMPLETED" } });
    return u;
  });

  return { status: "COMPLETED", balance: toMoney(updated.balance) };
};