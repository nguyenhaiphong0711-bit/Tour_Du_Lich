const {
  checkPermission
} = require("../../middlewares/admin/auth.middleware");
const router = require("express")
  .Router();
const contactController = require("../../controllers/admin/contact.controller");

router.get('/list', checkPermission("contact-view"), contactController.list)

router.patch('/delete/:id', checkPermission("contact-delete"), contactController.deletePatch)
module.exports = router;
