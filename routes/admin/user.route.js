const { checkPermission } = require("../../middlewares/admin/auth.middleware");
const router = require("express").Router();
const userController = require("../../controllers/admin/user.controller");

router.get('/list', checkPermission("user-view"), userController.list)

module.exports = router;
