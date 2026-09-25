const proposalService = require("./proposal.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

exports.createProposal = catchAsync(async (req, res) => {
  const result = await proposalService.createProposal({
    jobId: req.params.jobId,
    freelancerId: req.user.id,
    ...req.body,
  });
  sendResponse(res, 201, "Proposal submitted successfully", result);
});

exports.listForJob = catchAsync(async (req, res) => {
  const result = await proposalService.listForJob({
    jobId: req.params.jobId,
    clientId: req.user.id,
    page: req.query.page,
    limit: req.query.limit,
  });
  sendResponse(res, 200, "Proposals retrieved successfully", result);
});

exports.myProposals = catchAsync(async (req, res) => {
  const result = await proposalService.myProposals({
    freelancerId: req.user.id,
    page: req.query.page,
    limit: req.query.limit,
  });
  sendResponse(res, 200, "Your proposals retrieved successfully", result);
});

exports.getById = catchAsync(async (req, res) => {
  const result = await proposalService.getById({ proposalId: req.params.id, userId: req.user.id });
  sendResponse(res, 200, "Proposal retrieved successfully", result);
});

exports.updateProposal = catchAsync(async (req, res) => {
  const result = await proposalService.updateProposal({
    proposalId: req.params.id,
    freelancerId: req.user.id,
    update: req.body,
  });
  sendResponse(res, 200, "Proposal updated successfully", result);
});

exports.withdrawProposal = catchAsync(async (req, res) => {
  const result = await proposalService.withdrawProposal({
    proposalId: req.params.id,
    freelancerId: req.user.id,
  });
  sendResponse(res, 200, "Proposal withdrawn successfully", result);
});

exports.rejectProposal = catchAsync(async (req, res) => {
  const result = await proposalService.rejectProposal({
    proposalId: req.params.id,
    clientId: req.user.id,
  });
  sendResponse(res, 200, "Proposal rejected successfully", result);
});

exports.acceptProposal = catchAsync(async (req, res) => {
  const result = await proposalService.acceptProposal({
    proposalId: req.params.id,
    clientId: req.user.id,
  });
  sendResponse(res, 201, "Proposal accepted. Project created successfully.", result);
});