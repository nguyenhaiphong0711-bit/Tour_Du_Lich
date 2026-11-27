const {
  rateLimit
} = require("express-rate-limit");

module.exports.login = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: {
    code: "error",
    message: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút."
  }
});
module.exports.otp = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    code: "error",
    message: "Vui lòng thử lại sau 15 phút."
  }
});
module.exports.order = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: {
    code: "error",
    message: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau."
  }
});
