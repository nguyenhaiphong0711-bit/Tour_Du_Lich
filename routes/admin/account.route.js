const rateLimit = require("../../middlewares/admin/rate-limit.middleware");
const router = require("express")
  .Router();
const accountController = require("../../controllers/admin/account.controller");
const accountValidate = require("../../validates/admin/account.validate")
const authMiddleware = require("../../middlewares/admin/auth.middleware")

router.get('/login', accountController.login)

router.post(
  '/login', rateLimit.login,
  accountValidate.loginPost,
  accountController.loginPost
)

router.get('/register', accountController.register)

router.post(
  '/register', rateLimit.login,
  accountValidate.registerPost,
  accountController.registerPost
)

router.get('/register-initial', accountController.registerInitial)

router.get('/forgot-password', accountController.forgotPassword)

router.post(
  '/forgot-password', rateLimit.otp,
  accountValidate.forgotPasswordPost,
  accountController.forgotPasswordPost
)

router.get('/otp-password', accountController.otpPassword)

router.post(
  '/otp-password', rateLimit.otp,
  accountValidate.otpPasswordPost,
  accountController.otpPasswordPost
)

router.get('/reset-password', accountController.resetPassword)

router.post(
  '/reset-password',
  authMiddleware.verifyResetToken,
  accountValidate.resetPasswordPost,
  accountController.resetPasswordPost
)

router.post('/logout', accountController.logoutPost)

module.exports = router;
