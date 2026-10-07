
require("./hooks")();const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const prisma = require("../src/config/prisma");


let clientToken, verifiedFreelancerToken, unverifiedFreelancerToken, client, job;

async function makeUser(overrides) {
  const u = await prisma.user.create({
    data: {
      name: "T",
      email: `${Math.random()}@t.dev`,
      phone: `+2347${Math.floor(Math.random() * 1e8)}`,
      passwordHash: await bcrypt.hash("Password123", 12),
      emailVerified: true,
      ...overrides,
    },
  });
  const res = await request(app).post("/api/v1/auth/login").send({
    email: u.email,
    password: "Password123",
  });
  return { user: u, token: res.body.data.accessToken };
}

beforeEach(async () => {
  ({ user: client, token: clientToken } = await makeUser({ role: "CLIENT", balance: 100000 }));
  ({ token: verifiedFreelancerToken } = await makeUser({ role: "FREELANCER", kycStatus: "VERIFIED" }));
  ({ token: unverifiedFreelancerToken } = await makeUser({ role: "FREELANCER" }));

  job = await prisma.job.create({
    data: {
      clientId: client.id,
      title: "Test job",
      description: "A job for testing purposes",
      category: "DESIGN",
      budgetMin: 10000,
      budgetMax: 50000,
    },
  });
});

const propose = (token, jobId, extra = {}) =>
  request(app).post(`/api/v1/jobs/${jobId}/proposals`).set("Authorization", `Bearer ${token}`).send({
    coverLetter: "I will deliver this excellently and on time",
    bidAmount: 30000,
    estimatedDays: 7,
    ...extra,
  });

describe("Marketplace rules", () => {
  it("blocks self-bidding", async () => {
    const res = await propose(clientToken, job.id);
    expect(res.status).toBe(403);
  });

  it("blocks duplicate proposals with 409", async () => {
    await propose(verifiedFreelancerToken, job.id);
    const res = await propose(verifiedFreelancerToken, job.id);
    expect(res.status).toBe(409);
  });

  it("blocks accepting proposals from unverified freelancers (KYC gate)", async () => {
    const p = await propose(unverifiedFreelancerToken, job.id);
    const res = await request(app)
      .post(`/api/v1/proposals/${p.body.data.proposal.id}/accept`)
      .set("Authorization", `Bearer ${clientToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/KYC/i);
  });

  it("accepting a verified proposal creates project + rejects others", async () => {
    const p1 = await propose(verifiedFreelancerToken, job.id);
    const p2 = await propose(unverifiedFreelancerToken, job.id);

    const res = await request(app)
      .post(`/api/v1/proposals/${p1.body.data.proposal.id}/accept`)
      .set("Authorization", `Bearer ${clientToken}`);
    expect(res.status).toBe(201);
    expect(res.body.data.project.status).toBe("ACTIVE");

    const jobAfter = await prisma.job.findUnique({ where: { id: job.id } });
    expect(jobAfter.status).toBe("IN_PROGRESS");

    const other = await prisma.proposal.findUnique({ where: { id: p2.body.data.proposal.id } });
    expect(other.status).toBe("REJECTED");

    const conversation = await prisma.conversation.findUnique({ where: { projectId: res.body.data.project.id } });
    expect(conversation).not.toBeNull();
  });

  it("milestone approval moves money and completes the project", async () => {
    const { user: freelancer } = await makeUser({ role: "FREELANCER", kycStatus: "VERIFIED" });
    const freelancerLogin = await request(app).post("/api/v1/auth/login").send({
      email: freelancer.email, password: "Password123",
    });
    const fToken = freelancerLogin.body.data.accessToken;

    const p = await propose(fToken, job.id);
    const acc = await request(app)
      .post(`/api/v1/proposals/${p.body.data.proposal.id}/accept`)
      .set("Authorization", `Bearer ${clientToken}`);
    const projectId = acc.body.data.project.id;

    const m = await request(app)
      .post(`/api/v1/projects/${projectId}/milestones`)
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ title: "Full delivery", description: "Everything described in the job post", amount: 30000, dueDate: new Date(Date.now() + 86400000).toISOString() });
    expect(m.status).toBe(201);

    const sub = await request(app)
      .post(`/api/v1/milestones/${m.body.data.milestone.id}/submit`)
      .set("Authorization", `Bearer ${fToken}`)
      .send({ submission: "All deliverables completed as agreed" });
    expect(sub.status).toBe(200);

    const approve = await request(app)
      .post(`/api/v1/milestones/${m.body.data.milestone.id}/approve`)
      .set("Authorization", `Bearer ${clientToken}`);
    expect(approve.status).toBe(200);
    expect(approve.body.data.projectCompleted).toBe(true);

    const fAfter = await prisma.user.findUnique({ where: { id: freelancer.id } });
    const cAfter = await prisma.user.findUnique({ where: { id: client.id } });
    expect(Number(fAfter.balance)).toBe(30000);
    expect(Number(cAfter.balance)).toBe(70000);
  });

  it("blocks milestone approval when client has insufficient balance", async () => {
    const poorClient = await makeUser({ role: "CLIENT", balance: 0 });
    const { user: freelancer } = await makeUser({ role: "FREELANCER", kycStatus: "VERIFIED" });
    const fLogin = await request(app).post("/api/v1/auth/login").send({ email: freelancer.email, password: "Password123" });

    const job2 = await prisma.job.create({
      data: { clientId: poorClient.user.id, title: "J2", description: "another test job here", category: "DATA", budgetMin: 1000, budgetMax: 9000 },
    });
    const p = await propose(fLogin.body.data.accessToken, job2.id, { bidAmount: 5000, coverLetter: "bid for the second test job" });
    const acc = await request(app).post(`/api/v1/proposals/${p.body.data.proposal.id}/accept`).set("Authorization", `Bearer ${poorClient.token}`);
    const m = await request(app)
      .post(`/api/v1/projects/${acc.body.data.project.id}/milestones`)
      .set("Authorization", `Bearer ${poorClient.token}`)
      .send({ title: "Part", description: "partial delivery of the work", amount: 5000, dueDate: new Date(Date.now() + 86400000).toISOString() });
    await request(app)
      .post(`/api/v1/milestones/${m.body.data.milestone.id}/submit`)
      .set("Authorization", `Bearer ${fLogin.body.data.accessToken}`)
      .send({ submission: "done as requested in the job" });

    const approve = await request(app)
      .post(`/api/v1/milestones/${m.body.data.milestone.id}/approve`)
      .set("Authorization", `Bearer ${poorClient.token}`);
    expect(approve.status).toBe(402);
  });
});