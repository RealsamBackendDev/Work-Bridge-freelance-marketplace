const milestoneService = require("./milestone.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

exports.createMilestone = catchAsync(async (req, res) => {
  const result = await milestoneService.createMilestone({ projectId: req.params.projectId, clientId: req.user.id, ...req.body });
  sendResponse(res, 201, "Milestone created successfully", result);
});

exports.listForProject = catchAsync(async (req, res) => {
  const result = await milestoneService.listForProject({ projectId: req.params.projectId, userId: req.user.id });
  sendResponse(res, 200, "Milestones retrieved successfully", result);
});

exports.updateMilestone = catchAsync(async (req, res) => {
  const result = await milestoneService.updateMilestone({ milestoneId: req.params.id, clientId: req.user.id, update: req.body });
  sendResponse(res, 200, "Milestone updated successfully", result);
});

exports.submitMilestone = catchAsync(async (req, res) => {
  const result = await milestoneService.submitMilestone({ milestoneId: req.params.id, freelancerId: req.user.id, submission: req.body.submission });
  sendResponse(res, 200, "Milestone submitted successfully", result);
});

exports.approveMilestone = catchAsync(async (req, res) => {
  const result = await milestoneService.approveMilestone({ milestoneId: req.params.id, clientId: req.user.id });
  const message = result.projectCompleted
    ? "Milestone approved and paid. All milestones complete — project marked as completed."
    : "Milestone approved and paid successfully";
  sendResponse(res, 200, message, result);
});

exports.rejectMilestone = catchAsync(async (req, res) => {
  const result = await milestoneService.rejectMilestone({ milestoneId: req.params.id, clientId: req.user.id, reason: req.body.reason });
  sendResponse(res, 200, "Milestone rejected", result);
});