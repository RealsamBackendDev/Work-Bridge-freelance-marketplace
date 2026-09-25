const { Router } = require("express");
const jobController = require("./job.controller");
const { authenticate } = require("../../middleware/authenticate");
const { authorize } = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const {
  createJobSchema,
  updateJobSchema,
  jobIdSchema,
  listJobsSchema,
} = require("./job.validator");

const router = Router();

router.post("/", authenticate, authorize("CLIENT"), validate(createJobSchema), jobController.createJob);
router.get("/", validate(listJobsSchema), jobController.listJobs);
router.get("/my", authenticate, authorize("CLIENT"), validate(listJobsSchema), jobController.myJobs);
router.get("/:id", validate(jobIdSchema), jobController.getJobById);
router.put("/:id", authenticate, authorize("CLIENT"), validate(updateJobSchema), jobController.updateJob);
router.post("/:id/cancel", authenticate, authorize("CLIENT"), validate(jobIdSchema), jobController.cancelJob);

module.exports = router;