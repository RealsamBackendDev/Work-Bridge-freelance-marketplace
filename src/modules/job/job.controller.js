const jobService = require("./job.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

exports.createJob = catchAsync(async (req, res) => {
  const result = await jobService.createJob({ clientId: req.user.id, ...req.body });
  sendResponse(res, 201, "Job posted successfully", result);
});

exports.listJobs = catchAsync(async (req, res) => {
  const result = await jobService.listJobs(req.query);
  sendResponse(res, 200, "Jobs retrieved successfully", result);
});

exports.myJobs = catchAsync(async (req, res) => {
  const result = await jobService.listJobs({ ...req.query, clientId: req.user.id });
  sendResponse(res, 200, "Your jobs retrieved successfully", result);
});

exports.getJobById = catchAsync(async (req, res) => {
  const result = await jobService.getJobById(req.params.id);
  sendResponse(res, 200, "Job retrieved successfully", result);
});

exports.updateJob = catchAsync(async (req, res) => {
  const result = await jobService.updateJob({ jobId: req.params.id, clientId: req.user.id, update: req.body });
  sendResponse(res, 200, "Job updated successfully", result);
});

exports.cancelJob = catchAsync(async (req, res) => {
  const result = await jobService.cancelJob({ jobId: req.params.id, clientId: req.user.id });
  sendResponse(res, 200, "Job cancelled successfully", result);
});