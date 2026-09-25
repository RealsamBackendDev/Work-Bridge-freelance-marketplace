const { Router } = require("express");
const proposalController = require("./proposal.controller");
const { authenticate } = require("../../middleware/authenticate");
const { authorize } = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const {
  createProposalSchema,
  updateProposalSchema,
  listJobProposalsSchema,
  myProposalsSchema,
  proposalIdSchema,
} = require("./proposal.validator");

const router = Router();

router.post(
  "/jobs/:jobId/proposals",
  authenticate,
  authorize("FREELANCER"),
  validate(createProposalSchema),
  proposalController.createProposal
);

router.get(
  "/jobs/:jobId/proposals",
  authenticate,
  authorize("CLIENT"),
  validate(listJobProposalsSchema),
  proposalController.listForJob
);

router.get("/proposals/my", authenticate, authorize("FREELANCER"), validate(myProposalsSchema), proposalController.myProposals);
router.get("/proposals/:id", authenticate, validate(proposalIdSchema), proposalController.getById);
router.put("/proposals/:id", authenticate, authorize("FREELANCER"), validate(updateProposalSchema), proposalController.updateProposal);
router.delete("/proposals/:id", authenticate, authorize("FREELANCER"), validate(proposalIdSchema), proposalController.withdrawProposal);
router.post("/proposals/:id/accept", authenticate, authorize("CLIENT"), validate(proposalIdSchema), proposalController.acceptProposal);
router.post("/proposals/:id/reject", authenticate, authorize("CLIENT"), validate(proposalIdSchema), proposalController.rejectProposal);

module.exports = router;