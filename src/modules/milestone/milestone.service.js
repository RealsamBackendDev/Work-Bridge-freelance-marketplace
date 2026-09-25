const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

const toMoney = (d) => (d === null || d === undefined ? null : Number(d));

const publicMilestone = (m) => ({
  id: m.id,
  projectId: m.projectId,
  title: m.title,
  description: m.description,
  amount: toMoney(m.amount),
  dueDate: m.dueDate,
  status: m.status,
  submission: m.submission,
  rejectionReason: m.rejectionReason,
  submissionAttempts: m.submissionAttempts,
  submittedAt: m.submittedAt,
  completedAt: m.completedAt,
  createdAt: m.createdAt,
});

const getProjectForMilestoneAction = async (projectId) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");
  return project;
};

exports.createMilestone = async ({ projectId, clientId, title, description, amount, dueDate }) => {
  const project = await getProjectForMilestoneAction(projectId);
  if (project.clientId !== clientId) throw new ApiError(403, "Only the project owner can add milestones");
  if (project.status !== "ACTIVE") throw new ApiError(400, "Milestones can only be added to active projects");

  const existing = await prisma.milestone.aggregate({
    where: { projectId },
    _sum: { amount: true },
  });
  const totalSoFar = Number(existing._sum.amount || 0);
  if (totalSoFar + amount > Number(project.budget)) {
    throw new ApiError(
      400,
      `Milestone amounts exceed project budget. Budget: ${Number(project.budget)}, already allocated: ${totalSoFar}`
    );
  }

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      title,
      description,
      amount,
      dueDate,
      status: "IN_PROGRESS",
    },
  });
  return { milestone: publicMilestone(milestone) };
};

exports.listForProject = async ({ projectId, userId }) => {
  const project = await getProjectForMilestoneAction(projectId);
  if (project.clientId !== userId && project.freelancerId !== userId) {
    throw new ApiError(403, "You do not have access to this project's milestones");
  }

  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
  return { milestones: milestones.map(publicMilestone) };
};

exports.updateMilestone = async ({ milestoneId, clientId, update }) => {
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new ApiError(404, "Milestone not found");

  const project = await getProjectForMilestoneAction(milestone.projectId);
  if (project.clientId !== clientId) throw new ApiError(403, "Only the project owner can edit milestones");
  if (["SUBMITTED", "APPROVED"].includes(milestone.status)) {
    throw new ApiError(400, `A ${milestone.status.toLowerCase()} milestone cannot be edited`);
  }

  if (update.amount) {
    const others = await prisma.milestone.aggregate({
      where: { projectId: milestone.projectId, id: { not: milestoneId } },
      _sum: { amount: true },
    });
    if (Number(others._sum.amount || 0) + update.amount > Number(project.budget)) {
      throw new ApiError(400, "Milestone amounts exceed project budget");
    }
  }

  const updated = await prisma.milestone.update({ where: { id: milestoneId }, data: update });
  return { milestone: publicMilestone(updated) };
};

exports.submitMilestone = async ({ milestoneId, freelancerId, submission }) => {
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new ApiError(404, "Milestone not found");

  const project = await getProjectForMilestoneAction(milestone.projectId);
  if (project.freelancerId !== freelancerId) {
    throw new ApiError(403, "Only the assigned freelancer can submit this milestone");
  }
  if (!["IN_PROGRESS", "REJECTED"].includes(milestone.status)) {
    throw new ApiError(400, `This milestone cannot be submitted while ${milestone.status.toLowerCase()}`);
  }

  const newAttempts = milestone.submissionAttempts + 1;
  if (newAttempts > 3) {
    throw new ApiError(400, "Maximum submission attempts (3) reached. Contact support.");
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      submission,
      status: "SUBMITTED",
      submissionAttempts: newAttempts,
      submittedAt: new Date(),
      rejectionReason: "",
    },
  });
  return { milestone: publicMilestone(updated) };
};

exports.approveMilestone = async ({ milestoneId, clientId }) => {
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new ApiError(404, "Milestone not found");

  const project = await getProjectForMilestoneAction(milestone.projectId);
  if (project.clientId !== clientId) throw new ApiError(403, "Only the project owner can approve milestones");
  if (milestone.status !== "SUBMITTED") {
    throw new ApiError(400, "Only submitted milestones can be approved");
  }

  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (Number(client.balance) < Number(milestone.amount)) {
    throw new ApiError(402, "Insufficient balance. Top up your wallet to approve this milestone.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const approved = await tx.milestone.update({
      where: { id: milestoneId },
      data: { status: "APPROVED", completedAt: new Date() },
    });

    await tx.user.update({
      where: { id: clientId },
      data: { balance: { decrement: milestone.amount } },
    });
    await tx.user.update({
      where: { id: project.freelancerId },
      data: { balance: { increment: milestone.amount } },
    });

    const transaction = await tx.transaction.create({
      data: {
        milestoneId: milestone.id,
        projectId: project.id,
        fromUserId: clientId,
        toUserId: project.freelancerId,
        amount: milestone.amount,
        type: "MILESTONE_PAYMENT",
        status: "COMPLETED",
      },
    });

    const remaining = await tx.milestone.count({
      where: { projectId: project.id, status: { in: ["PENDING", "IN_PROGRESS", "SUBMITTED"] } },
    });
    let projectCompleted = false;
    if (remaining === 0) {
      await tx.project.update({
        where: { id: project.id },
        data: { status: "COMPLETED", endDate: new Date() },
      });
      await tx.job.update({ where: { id: project.jobId }, data: { status: "COMPLETED" } });
      projectCompleted = true;
    }

    return { approved, transaction, projectCompleted };
  });

  return {
    milestone: publicMilestone(result.approved),
    transaction: {
      id: result.transaction.id,
      amount: toMoney(result.transaction.amount),
      status: result.transaction.status,
    },
    projectCompleted: result.projectCompleted,
  };
};

exports.rejectMilestone = async ({ milestoneId, clientId, reason }) => {
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new ApiError(404, "Milestone not found");

  const project = await getProjectForMilestoneAction(milestone.projectId);
  if (project.clientId !== clientId) throw new ApiError(403, "Only the project owner can reject milestones");
  if (milestone.status !== "SUBMITTED") {
    throw new ApiError(400, "Only submitted milestones can be rejected");
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: "REJECTED", rejectionReason: reason },
  });
  return { milestone: publicMilestone(updated) };
};