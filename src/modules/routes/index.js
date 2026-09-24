const { Router } = require("express");
const authRoutes = require("../modules/auth/auth.routes");

const router = Router();

router.get("/health", (req, res) =>
  res.json({ success: true, message: "WorkBridge API is healthy", data: null })
);
router.use("/auth", authRoutes);

module.exports = router;