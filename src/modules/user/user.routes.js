const { Router } = require("express");
const userController = require("./user.controller");
const { authenticate } = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");
const { updateProfileSchema } = require("./user.validator");

const router = Router();

router.get("/users/me", authenticate, userController.getMyProfile);
router.patch("/users/me", authenticate, validate(updateProfileSchema), userController.updateProfile);

module.exports = router;