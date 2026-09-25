const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/prisma");

const server = app.listen(env.PORT, () =>
  console.log(`WorkBridge API running on http://localhost:${env.PORT}/api/v1`)
);


const shutdown = async () => {
  console.log("Shutting down...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);