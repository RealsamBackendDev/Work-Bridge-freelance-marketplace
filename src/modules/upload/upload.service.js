const cloudinary = require("../../config/cloudinary");
const ApiError = require("../../utils/ApiError");

exports.uploadBuffer = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `workbridge/${folder}`, resource_type: "auto" },
      (err, result) => {
        if (err) return reject(new ApiError(500, "Upload failed. Please try again."));
        resolve(result);
      }
    );
    stream.end(buffer);
  });