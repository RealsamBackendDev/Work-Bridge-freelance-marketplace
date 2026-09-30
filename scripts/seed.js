require("../src/config/env");
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  console.log("🌱 Seeding WorkBridge database...");

  await prisma.transaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.job.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@workbridge.dev",
      phone: "+2347000000001",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const client1 = await prisma.user.create({
    data: {
      name: "Chidi Okafor",
      email: "chidi@client.dev",
      phone: "+2347000000002",
      passwordHash,
      role: "CLIENT",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      balance: 500000,
      location: "Lagos, Nigeria",
    },
  });

  const client2 = await prisma.user.create({
    data: {
      name: "Amara Eze",
      email: "amara@client.dev",
      phone: "+2347000000003",
      passwordHash,
      role: "CLIENT",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      balance: 250000,
      location: "Abuja, Nigeria",
    },
  });

  const freelancerVerified = await prisma.user.create({
    data: {
      name: "Ada Lovelace",
      email: "ada@freelancer.dev",
      phone: "+2347000000004",
      passwordHash,
      role: "FREELANCER",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      kycStatus: "VERIFIED",
      kycDocumentType: "NIN",
      kycDocumentNo: "12345678901",
      kycReviewedAt: new Date(),
      skills: ["Node.js", "React", "PostgreSQL"],
      hourlyRate: 50,
      bio: "Full-stack developer with 6 years of experience building marketplaces.",
      location: "Remote",
    },
  });

  const freelancerPending = await prisma.user.create({
    data: {
      name: "Tunde Bakare",
      email: "tunde@freelancer.dev",
      phone: "+2347000000005",
      passwordHash,
      role: "FREELANCER",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      kycStatus: "PENDING",
      kycDocumentType: "PASSPORT",
      kycDocumentNo: "A12345678",
      skills: ["UI/UX", "Figma", "Branding"],
      bio: "Product designer focused on clean, conversion-driven interfaces.",
    },
  });

  const freelancerNew = await prisma.user.create({
    data: {
      name: "Ngozi Musa",
      email: "ngozi@freelancer.dev",
      phone: "+2347000000006",
      passwordHash,
      role: "FREELANCER",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      skills: ["Copywriting", "SEO"],
      bio: "Content writer and SEO specialist.",
    },
  });

  const jobOpen1 = await prisma.job.create({
    data: {
      clientId: client1.id,
      title: "Build a REST API for an inventory system",
      description:
        "We need a Node.js/PostgreSQL REST API for tracking stock across 3 warehouses. Must include authentication, role-based access, and audit logs. Clean architecture and tests expected.",
      category: "WEB_DEVELOPMENT",
      skillsRequired: ["Node.js", "PostgreSQL", "REST"],
      budgetMin: 150000,
      budgetMax: 300000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const jobOpen2 = await prisma.job.create({
    data: {
      clientId: client2.id,
      title: "Design a mobile app onboarding flow",
      description:
        "Looking for a product designer to redesign our fintech app's onboarding. Deliverables: wireframes, high-fidelity mockups, and a Figma prototype. Brand guidelines provided.",
      category: "DESIGN",
      skillsRequired: ["Figma", "UI/UX", "Mobile"],
      budgetMin: 80000,
      budgetMax: 150000,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.proposal.create({
    data: {
      jobId: jobOpen1.id,
      freelancerId: freelancerVerified.id,
      coverLetter:
        "I have built two inventory systems exactly like this. I will deliver a modular Node.js API with JWT auth, RBAC, full test coverage, and Swagger docs — all within 21 days.",
      bidAmount: 250000,
      estimatedDays: 21,
    },
  });

  await prisma.proposal.create({
    data: {
      jobId: jobOpen1.id,
      freelancerId: freelancerNew.id,
      coverLetter:
        "I am a fast learner with strong writing skills and attention to detail. I will research best practices and deliver on time.",
      bidAmount: 180000,
      estimatedDays: 30,
    },
  });

  await prisma.proposal.create({
    data: {
      jobId: jobOpen2.id,
      freelancerId: freelancerPending.id,
      coverLetter:
        "My portfolio includes three fintech onboarding redesigns that lifted activation by 20%+. I will deliver wireframes in week one and the full prototype by week three.",
      bidAmount: 120000,
      estimatedDays: 18,
    },
  });

  const jobInProgress = await prisma.job.create({
    data: {
      clientId: client1.id,
      title: "Company website redesign",
      description:
        "Redesign our corporate website (12 pages) with a modern stack: React frontend, CMS-driven content, and a contact form wired to our CRM.",
      category: "WEB_DEVELOPMENT",
      skillsRequired: ["React", "Tailwind"],
      budgetMin: 200000,
      budgetMax: 400000,
      status: "IN_PROGRESS",
      hiredFreelancerId: freelancerVerified.id,
    },
  });

  const acceptedProposal = await prisma.proposal.create({
    data: {
      jobId: jobInProgress.id,
      freelancerId: freelancerVerified.id,
      coverLetter:
        "I will rebuild the site in React with Tailwind, set up a headless CMS, and deliver page-by-page milestones so you can review as we go.",
      bidAmount: 350000,
      estimatedDays: 28,
      status: "ACCEPTED",
    },
  });

  const project = await prisma.project.create({
    data: {
      jobId: jobInProgress.id,
      proposalId: acceptedProposal.id,
      clientId: client1.id,
      freelancerId: freelancerVerified.id,
      title: jobInProgress.title,
      description: jobInProgress.description,
      budget: 350000,
    },
  });

  await prisma.conversation.create({
    data: {
      projectId: project.id,
      clientId: client1.id,
      freelancerId: freelancerVerified.id,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: "Homepage + design system",
      description: "Deliver the redesigned homepage and the Tailwind design system tokens for the whole site.",
      amount: 150000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "IN_PROGRESS",
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: project.id,
      title: "Remaining 11 pages + CMS",
      description: "Deliver all inner pages, wire the headless CMS, and connect the contact form to the CRM.",
      amount: 200000,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: "PENDING",
    },
  });

  await prisma.message.create({
    data: {
      conversationId: (await prisma.conversation.findUnique({ where: { projectId: project.id } })).id,
      senderId: client1.id,
      body: "Welcome aboard, Ada! Let's start with the homepage milestone. Brand assets are in the shared drive.",
    },
  });

  console.log("✅ Seed complete. Demo credentials (password for all: Password123):");
  console.log("");
  console.log("  ADMIN (pending KYC reviews)   admin@workbridge.dev");
  console.log("  CLIENT (₦500k wallet, 2 jobs) chidi@client.dev");
  console.log("  CLIENT (₦250k wallet)         amara@client.dev");
  console.log("  FREELANCER (KYC VERIFIED)     ada@freelancer.dev");
  console.log("  FREELANCER (KYC PENDING)      tunde@freelancer.dev");
  console.log("  FREELANCER (KYC NOT SUBMITTED) ngozi@freelancer.dev");
  console.log("");
  console.log("  Scenarios ready to demo:");
  console.log("  • chidi accepts ada's proposal on 'inventory API' job → instant project");
  console.log("  • chidi rejects tunde's KYC (admin workflow)");
  console.log("  • ada submits milestone 1 → chidi approves → ₦150k moves → check wallets");
  console.log("  • ngozi's proposals prove the KYC gate (accept → 400)");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });