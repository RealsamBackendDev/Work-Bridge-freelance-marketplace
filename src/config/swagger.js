const swaggerJsdoc = require("swagger-jsdoc");
const env = require("./env");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WorkBridge API",
      version: "1.0.0",
      description:
        "Freelance marketplace API — clients post jobs, freelancers submit proposals, projects move through milestones with simulated wallet payments.",
    },
    servers: [{ url: `http://localhost:${env.PORT}/api/v1` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },
  apis: ["./src/modules/**/*.routes.js"],
};

module.exports = swaggerJsdoc(options);