const {
  checkPermission
} = require("../../middlewares/admin/auth.middleware");
const router = require("express")
  .Router();
const categoryController = require("../../controllers/admin/category.controller");
const categoryValidate = require("../../validates/admin/category.validate");
const multer = require('multer');
const cloudinaryHelper = require("../../helpers/cloudinary.helper");
const upload = multer(cloudinaryHelper.options);

router.get('/list', checkPermission("category-view"), categoryController.list)

router.get('/create', checkPermission("category-create"), categoryController.create)

router.post(
  '/create', checkPermission("category-create"),
  upload.single('avatar'),
  categoryValidate.createPost,
  categoryController.createPost
)

router.get('/edit/:id', checkPermission("category-edit"), categoryController.edit)

router.patch(
  '/edit/:id', checkPermission("category-edit"),
  upload.single('avatar'),
  categoryValidate.createPost,
  categoryController.editPatch
)

router.patch('/delete/:id', checkPermission("category-delete"), categoryController.deletePatch)

router.patch('/change-multi', categoryController.changeMultiPatch)

module.exports = router;
