const { Router } = require("express");
const milestoneController = require("./milestone.controller");
const { authenticate } = require("../../middleware/authenticate");
const { authorize } = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const {
  createMilestoneSchema,
  updateMilestoneSchema,
  submitSchema,
  rejectSchema,
  milestoneIdSchema,
  listMilestonesSchema,
} = require("./milestone.validator");

const router = Router();

router.post("/projects/:projectId/milestones", authenticate, authorize("CLIENT"), validate(createMilestoneSchema), milestoneController.createMilestone);
router.get("/projects/:projectId/milestones", authenticate, validate(listMilestonesSchema), milestoneController.listForProject);
router.put("/milestones/:id", authenticate, authorize("CLIENT"), validate(updateMilestoneSchema), milestoneController.updateMilestone);
router.post("/milestones/:id/submit", authenticate, authorize("FREELANCER"), validate(submitSchema), milestoneController.submitMilestone);
router.post("/milestones/:id/approve", authenticate, authorize("CLIENT"), validate(milestoneIdSchema), milestoneController.approveMilestone);
router.post("/milestones/:id/reject", authenticate, authorize("CLIENT"), validate(rejectSchema), milestoneController.rejectMilestone);

module.exports = router;