const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");

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

router.use("/auth", authRoutes);

module.exports = router;