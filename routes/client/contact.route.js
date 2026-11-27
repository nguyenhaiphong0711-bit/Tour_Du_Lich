const router = require("express")
  .Router();
const contactController = require("../../controllers/client/contact.controller");

router.post('/create', require('../../middlewares/admin/rate-limit.middleware')
  .order, contactController.createPost)

module.exports = router;
