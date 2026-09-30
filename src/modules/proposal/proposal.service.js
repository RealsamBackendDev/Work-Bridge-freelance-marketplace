const prisma = require("../../config/prisma");
const ApiError = require("../../utils/ApiError");

const toMoney = (d) => (d === null || d === undefined ? null : Number(d));

const publicProposal = (p) => ({
  id: p.id,
  jobId: p.jobId,
  job: p.job ? { id: p.job.id, title: p.job.title } : undefined,
  freelancer: p.freelancer
    ? { id: p.freelancer.id, name: p.freelancer.name, skills: p.freelancer.skills, hourlyRate: toMoney(p.freelancer.hourlyRate) }
    : undefined,
  coverLetter: p.coverLetter,
  bidAmount: toMoney(p.bidAmount),
  estimatedDays: p.estimatedDays,
  status: p.status,
  createdAt: p.createdAt,
});

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
});

exports.createProposal = async ({ jobId, freelancerId, coverLetter, bidAmount, estimatedDays }) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");
  if (job.status !== "OPEN") throw new ApiError(400, "This job is no longer accepting proposals");
  if (job.clientId === freelancerId) throw new ApiError(403, "You cannot submit a proposal on your own job");

  try {
    const proposal = await prisma.proposal.create({
      data: { jobId, freelancerId, coverLetter, bidAmount, estimatedDays },
      include: { job: { select: { id: true, title: true } } },
    });
    return { proposal: publicProposal(proposal) };
  } catch (err) {
    if (err.code === "P2002") {
      throw new ApiError(409, "You have already submitted a proposal for this job");
    }
    throw err;
  }
};

exports.listForJob = async ({ jobId, clientId, page, limit }) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new ApiError(404, "Job not found");
  if (job.clientId !== clientId) {
    throw new ApiError(403, "Only the job owner can view proposals for this job");
  }

  const skip = (page - 1) * limit;
  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      where: { jobId },
      include: {
        freelancer: { select: { id: true, name: true, skills: true, hourlyRate: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.proposal.count({ where: { jobId } }),
  ]);

  return {
    proposals: proposals.map(publicProposal),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

exports.myProposals = async ({ freelancerId, page, limit }) => {
  const skip = (page - 1) * limit;
  const [proposals, total] = await Promise.all([
    prisma.proposal.findMany({
      where: { freelancerId },
      include: { job: { select: { id: true, title: true, budgetMin: true, budgetMax: true, status: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.proposal.count({ where: { freelancerId } }),
  ]);

  const shaped = proposals.map((p) => ({
    ...publicProposal(p),
    job: p.job
      ? {
          id: p.job.id,
          title: p.job.title,
          budgetMin: toMoney(p.job.budgetMin),
          budgetMax: toMoney(p.job.budgetMax),
          status: p.job.status,
        }
      : undefined,
  }));

  return { proposals: shaped, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

exports.getById = async ({ proposalId, userId }) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      job: { select: { id: true, title: true, clientId: true, status: true } },
      freelancer: { select: { id: true, name: true, skills: true, hourlyRate: true } },
    },
  });
  if (!proposal) throw new ApiError(404, "Proposal not found");

  const isFreelancer = proposal.freelancerId === userId;
  const isClient = proposal.job.clientId === userId;
  if (!isFreelancer && !isClient) throw new ApiError(403, "You do not have access to this proposal");

  return { proposal: publicProposal(proposal) };
};

exports.updateProposal = async ({ proposalId, freelancerId, update }) => {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, freelancerId, status: "PENDING" },
  });
  if (!proposal) throw new ApiError(404, "Proposal not found or can no longer be edited");

  const updated = await prisma.proposal.update({ where: { id: proposalId }, data: update });
  return { proposal: publicProposal(updated) };
};

exports.withdrawProposal = async ({ proposalId, freelancerId }) => {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, freelancerId, status: "PENDING" },
  });
  if (!proposal) throw new ApiError(404, "Proposal not found or can no longer be withdrawn");

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "WITHDRAWN" },
  });
  return { proposal: publicProposal(updated) };
};

exports.rejectProposal = async ({ proposalId, clientId }) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { job: { select: { clientId: true, status: true } } },
  });
  if (!proposal) throw new ApiError(404, "Proposal not found");
  if (proposal.job.clientId !== clientId) {
    throw new ApiError(403, "Only the job owner can reject proposals");
  }
  if (proposal.status !== "PENDING") {
    throw new ApiError(400, `This proposal is already ${proposal.status.toLowerCase()}`);
  }

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "REJECTED" },
  });
  return { proposal: publicProposal(updated) };
};

exports.acceptProposal = async ({ proposalId, clientId }) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: { job: true },
  });
  if (!proposal) throw new ApiError(404, "Proposal not found");
  if (proposal.job.clientId !== clientId) {
    throw new ApiError(403, "Only the job owner can accept proposals");
  }
  if (proposal.status !== "PENDING" || proposal.job.status !== "OPEN") {
    throw new ApiError(400, "This proposal can no longer be accepted");
  }
    const freelancer = await prisma.user.findUnique({ where: { id: proposal.freelancerId } });
  if (freelancer.kycStatus !== "VERIFIED") {
    throw new ApiError(400, "This freelancer has not completed KYC verification");
  }

  const [updatedProposal, project] = await prisma.$transaction(async (tx) => {
    const accepted = await tx.proposal.update({
      where: { id: proposalId },
      data: { status: "ACCEPTED" },
    });

    await tx.proposal.updateMany({
      where: { jobId: proposal.jobId, id: { not: proposalId }, status: "PENDING" },
      data: { status: "REJECTED" },
    });

    await tx.job.update({
      where: { id: proposal.jobId },
      data: { status: "IN_PROGRESS", hiredFreelancerId: proposal.freelancerId },
    });

    const createdProject = await tx.project.create({
      data: {
        jobId: proposal.jobId,
        proposalId: proposal.id,
        clientId: proposal.job.clientId,
        freelancerId: proposal.freelancerId,
        title: proposal.job.title,
        description: proposal.job.description,
        budget: proposal.bidAmount,
      },
    });

    return [accepted, createdProject];
  });
      await tx.conversation.create({
      data: {
        projectId: createdProject.id,
        clientId: proposal.job.clientId,
        freelancerId: proposal.freelancerId,
      },
    });

  return {
    proposal: publicProposal(updatedProposal),
    project: publicProject(project),
  };
};