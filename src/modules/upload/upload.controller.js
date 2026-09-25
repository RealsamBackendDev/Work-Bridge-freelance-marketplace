const uploadService = require("./upload.service");
const catchAsync = require("../../utils/catchAsync");
const { sendResponse } = require("../../utils/sendResponse");

exports.uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file provided", data: null });
  }

  const folder = ["avatar", "kyc", "milestone"].includes(req.body.purpose)
    ? req.body.purpose
    : "misc";

  const result = await uploadService.uploadBuffer(req.file.buffer, folder);
  sendResponse(res, 200, "File uploaded successfully", {
    url: result.secure_url,
    publicId: result.public_id,
    purpose: folder,
  });
});