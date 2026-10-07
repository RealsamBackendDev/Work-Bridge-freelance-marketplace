const prisma = require("../src/config/prisma");

module.exports = function registerDbHooks() {
  beforeAll(async () => {
    const { execSync } = require("child_process");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL:
          "postgresql://workbridge:workbridge_test@localhost:5433/workbridge_test?schema=public",
      },
    });
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.transaction.deleteMany(),
      prisma.withdrawal.deleteMany(),
      prisma.message.deleteMany(),
      prisma.conversation.deleteMany(),
      prisma.milestone.deleteMany(),
      prisma.project.deleteMany(),
      prisma.proposal.deleteMany(),
      prisma.job.deleteMany(),
      prisma.otpToken.deleteMany(),
      prisma.refreshToken.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
};