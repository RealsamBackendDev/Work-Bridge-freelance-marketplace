const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

const toMoney = (d) => (d === null || d === undefined ? null : Number(d));

const publicProject = (p) => ({
  id: p.id,
  jobId: p.jobId,
  proposalId: p.proposalId,
  clientId: p.clientId,
  freelancerId: p.freelancerId,
  title: p.title,
  description: p.description,
  budget: toMoney(p.budget),
  status: p.status,
  startDate: p.startDate,
  endDate: p.endDate,
  milestoneCount: p._count ? p._count.milestones : undefined,
  approvedMilestones: p._count ? p._count.milestones : undefined,
  createdAt: p.createdAt,
});

exports.listMyProjects = async ({ userId, role, status, page, limit }) => {
  const where = role === "CLIENT" ? { clientId: userId } : { freelancerId: userId };
  if (status) where.status = status;

  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { _count: { select: { milestones: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects: projects.map(publicProject),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

exports.getProjectById = async ({ projectId, userId }) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: { select: { milestones: true } },
      milestones: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          amount: true,
          dueDate: true,
          status: true,
        },
      },
    },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== userId && project.freelancerId !== userId) {
    throw new ApiError(403, "You do not have access to this project");
  }

  const approvedCount = await prisma.milestone.count({
    where: { projectId, status: "APPROVED" },
  });

  return {
    project: {
      ...publicProject(project),
      approvedMilestones: approvedCount,
      milestones: project.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        amount: toMoney(m.amount),
        dueDate: m.dueDate,
        status: m.status,
      })),
    },
  };
};

exports.completeProject = async ({ projectId, clientId }) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) throw new ApiError(403, "Only the project owner can complete it");
  if (project.status !== "ACTIVE") throw new ApiError(400, "Project is not active");

  const remaining = await prisma.milestone.count({
    where: { projectId, status: { in: ["PENDING", "IN_PROGRESS", "SUBMITTED"] } },
  });
  if (remaining > 0) {
    throw new ApiError(400, `Cannot complete: ${remaining} milestone(s) are not yet approved`);
  }

  const [updated] = await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: { status: "COMPLETED", endDate: new Date() },
    }),
    prisma.job.update({ where: { id: project.jobId }, data: { status: "COMPLETED" } }),
  ]);

  return { project: publicProject(updated) };
};