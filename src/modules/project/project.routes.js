const { Router } = require("express");
const projectController = require("./project.controller");
const { authenticate } = require("../../middleware/authenticate");
const { authorize } = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { projectIdSchema, listProjectsSchema } = require("./project.validator");

const router = Router();

router.get("/my", authenticate, authorize("CLIENT", "FREELANCER"), validate(listProjectsSchema), projectController.listMyProjects);
router.get("/:id", authenticate, validate(projectIdSchema), projectController.getProjectById);
router.post("/:id/complete", authenticate, authorize("CLIENT"), validate(projectIdSchema), projectController.completeProject);

module.exports = router;