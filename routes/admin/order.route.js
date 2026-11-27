const {
  checkPermission
} = require("../../middlewares/admin/auth.middleware");
const router = require("express")
  .Router();
const orderController = require("../../controllers/admin/order.controller");

router.get('/list', checkPermission("order-view"), orderController.list)

router.get('/edit/:id', checkPermission("order-view"), orderController.edit)

router.patch('/edit/:id', checkPermission("order-edit"), orderController.editPatch)

module.exports = router;
