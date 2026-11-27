const router = require("express").Router();
const controller = require("../../controllers/admin/coupon.controller");
const { checkPermission } = require("../../middlewares/admin/auth.middleware");
router.use(checkPermission("coupon-manage"));
router.get("/list", controller.list);
router.post("/save", controller.savePost);
router.patch("/:id", controller.statusPatch);
module.exports = router;
