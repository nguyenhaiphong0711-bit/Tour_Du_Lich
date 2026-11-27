const { checkPermission } = require("../../middlewares/admin/auth.middleware");
const router = require("express").Router();
const tourController = require("../../controllers/admin/tour.controller");
const tourValidate = require("../../validates/admin/tour.validate");
const multer  = require('multer');
const cloudinaryHelper = require("../../helpers/cloudinary.helper");
const upload = multer(cloudinaryHelper.options);

router.get('/list', checkPermission("tour-view"), tourController.list)

router.get('/create', checkPermission("tour-create"), tourController.create)

router.post(
  '/create', checkPermission("tour-create"),
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
  tourValidate.createPost,
  tourController.createPost
)

router.get('/trash', checkPermission("tour-trash"), tourController.trash)

router.get('/edit/:id', checkPermission("tour-edit"), tourController.edit)

router.patch(
  '/edit/:id', checkPermission("tour-edit"),
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'images', maxCount: 10 },
  ]),
  tourValidate.createPost,
  tourController.editPatch
)

router.patch('/delete/:id', checkPermission("tour-delete"), tourController.deletePatch)

router.patch('/undo/:id', checkPermission("tour-trash"), tourController.undoPatch)

router.delete('/destroy/:id', checkPermission("tour-delete"), tourController.destroyDelete)

router.patch('/change-multi', tourController.changeMultiPatch)

module.exports = router;
