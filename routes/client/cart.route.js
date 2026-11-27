const router = require("express").Router();
const cartController = require("../../controllers/client/cart.controller");

router.get('/', cartController.cart)

router.post('/detail', cartController.detailPost)

router.post('/coupon', require('../../middlewares/admin/rate-limit.middleware').order, cartController.couponPost)

module.exports = router;
