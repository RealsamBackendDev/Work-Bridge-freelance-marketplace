const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const proposalRoutes = require("../modules/proposal/proposal.routes");
const milestoneRoutes = require("../modules/milestone/milestone.routes");
const paymentRoutes = require("../modules/payment/payment.routes");
const projectRoutes = require("../modules/project/project.routes");
const jobRoutes = require("../modules/job/job.routes");
const messageRoutes = require("../modules/message/message.routes");

const router = Router();

router.use(uploadRoutes);
router.use(messageRoutes);

router.get("/", (req, res) =>
  res.json({
    success: true,
    message: "WorkBridge API v1",
    data: {
      docs: "See README for endpoints",
      health: "/api/v1/health",
    },
  })
);

router.get("/health", (req, res) =>
  res.json({ success: true, message: "WorkBridge API is healthy", data: null })
);

router.use(proposalRoutes);
router.use(milestoneRoutes);
router.use(paymentRoutes);
router.use("/projects", projectRoutes);
router.use("/jobs", jobRoutes);
router.use("/auth", authRoutes);

module.exports = router;