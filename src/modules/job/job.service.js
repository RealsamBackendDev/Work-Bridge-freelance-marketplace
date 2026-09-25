const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

const toMoney = (d) => (d === null || d === undefined ? null : Number(d));

const publicJob = (job) => ({
  id: job.id,
  title: job.title,
  description: job.description,
  category: job.category,
  skillsRequired: job.skillsRequired,
  budgetMin: toMoney(job.budgetMin),
  budgetMax: toMoney(job.budgetMax),
  status: job.status,
  deadline: job.deadline,
  client: job.client ? { id: job.client.id, name: job.client.name } : undefined,
  proposalCount: job._count ? job._count.proposals : undefined,
  createdAt: job.createdAt,
});

exports.createJob = async ({ clientId, title, description, category, skillsRequired, budgetMin, budgetMax, deadline }) => {
  const job = await prisma.job.create({
    data: {
      clientId,
      title,
      description,
      category,
      skillsRequired: skillsRequired || [],
      budgetMin,
      budgetMax,
      deadline: deadline || null,
    },
    include: { client: { select: { id: true, name: true } } },
  });
  return { job: publicJob(job) };
};

exports.listJobs = async ({ search, category, status, page, limit, clientId }) => {
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (clientId) where.clientId = clientId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs: jobs.map(publicJob),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

exports.getJobById = async (jobId) => {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { proposals: true } },
    },
  });
  if (!job) throw new ApiError(404, "Job not found");
  return { job: publicJob(job) };
};

exports.updateJob = async ({ jobId, clientId, update }) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");
  if (job.clientId !== clientId) throw new ApiError(403, "Only the job owner can edit this job");
  if (job.status !== "OPEN") throw new ApiError(400, "Only open jobs can be edited");

  const updated = await prisma.job.update({ where: { id: jobId }, data: update });
  return { job: publicJob(updated) };
};

exports.cancelJob = async ({ jobId, clientId }) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");
  if (job.clientId !== clientId) throw new ApiError(403, "Only the job owner can cancel this job");
  if (job.status !== "OPEN") throw new ApiError(400, "Only open jobs can be cancelled");

  const updated = await prisma.job.update({ where: { id: jobId }, data: { status: "CANCELLED" } });
  return { job: publicJob(updated) };
};