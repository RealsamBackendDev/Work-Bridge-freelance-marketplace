const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const proposalRoutes = require("../modules/proposal/proposal.routes");
const milestoneRoutes = require("../modules/milestone/milestone.routes");
const paymentRoutes = require("../modules/payment/payment.routes");
const uploadRoutes = require("../modules/upload/upload.routes");
const messageRoutes = require("../modules/message/message.routes");
const projectRoutes = require("../modules/project/project.routes");
const jobRoutes = require("../modules/job/job.routes");
const userRoutes = require("../modules/user/user.routes");

const router = Router();

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
router.use(uploadRoutes);
router.use(messageRoutes);
router.use("/projects", projectRoutes);
router.use("/jobs", jobRoutes);
router.use("/auth", authRoutes);
router.use("/user", userRoutes);

module.exports = router;