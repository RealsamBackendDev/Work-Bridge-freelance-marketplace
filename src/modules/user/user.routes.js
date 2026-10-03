const { Router } = require("express");
const userController = require("./user.controller");
const { authenticate } = require("../../middleware/authenticate");
const validate = require("../../middleware/validate");
const { updateProfileSchema } = require("./user.validator");
const { authorize } = require("../../middleware/authorize");

const router = Router();

router.get("/users/me", authenticate, userController.getMyProfile);
router.patch("/users/me", authenticate, validate(updateProfileSchema), userController.updateProfile);
router.get("/admin/kyc/pending", authenticate, authorize("ADMIN"), userController.listPendingKyc);

module.exports = router;