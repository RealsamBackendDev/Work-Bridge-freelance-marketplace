const projectService = require("./project.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

exports.listMyProjects = catchAsync(async (req, res) => {
  const result = await projectService.listMyProjects({
    userId: req.user.id,
    role: req.user.role,
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });
  sendResponse(res, 200, "Projects retrieved successfully", result);
});

exports.getProjectById = catchAsync(async (req, res) => {
  const result = await projectService.getProjectById({ projectId: req.params.id, userId: req.user.id });
  sendResponse(res, 200, "Project retrieved successfully", result);
});

exports.completeProject = catchAsync(async (req, res) => {
  const result = await projectService.completeProject({ projectId: req.params.id, clientId: req.user.id });
  sendResponse(res, 200, "Project completed successfully", result);
});