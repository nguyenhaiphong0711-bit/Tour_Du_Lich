const router = require("express").Router();
const orderController = require("../../controllers/client/order.controller");

router.post('/create', require('../../middlewares/admin/rate-limit.middleware').order, orderController.createPost)

router.get('/success', orderController.success)

router.get('/payment-zalopay', orderController.paymentZaloPay)

router.post('/payment-zalopay-result', orderController.paymentZaloPayResultPost)

router.get('/payment-vnpay', orderController.paymentVNPay)

router.get('/payment-vnpay-ipn', orderController.paymentVNPayIpn)

router.get('/payment-vnpay-result', orderController.paymentVNPayResult)

module.exports = router;
