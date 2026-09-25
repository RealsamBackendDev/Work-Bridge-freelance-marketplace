const { Router } = require("express");
const uploadController = require("./upload.controller");
const { authenticate } = require("../../middleware/authenticate");
const upload = require("../../middleware/upload");

const router = Router();

router.post("/upload", authenticate, upload.single("file"), uploadController.uploadFile);

module.exports = router;