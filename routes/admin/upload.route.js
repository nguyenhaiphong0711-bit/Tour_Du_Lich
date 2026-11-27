const router = require("express").Router();
const uploadController = require("../../controllers/admin/upload.controller");
const multer  = require('multer');
const cloudinaryHelper = require("../../helpers/cloudinary.helper");
const upload = multer(cloudinaryHelper.options);

router.post(
  '/image',
  (req, res, next) => req.permissions.some(item => ['tour-create', 'tour-edit', 'category-create', 'category-edit', 'setting-manage'].includes(item)) ? next() : res.status(403).json({ code: 'error', message: 'Không có quyền tải ảnh.' }),
  upload.single('file'),
  uploadController.imagePost
)

module.exports = router;
