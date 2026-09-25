const multer = require("multer");
const ApiError = require("../utils/ApiError");

const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(new ApiError(400, "Only JPG, PNG, WEBP images or PDF files are allowed"));
    }
    cb(null, true);
  },
});

module.exports = upload;