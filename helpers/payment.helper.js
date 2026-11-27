const crypto = require("crypto");
const qs = require("qs");
const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const bookingHelper = require("./booking.helper");

module.exports.safeEqual = (left, right) => {
  if(typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports.sortObject = (obj) => {
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    if(typeof obj[key] !== "string" && typeof obj[key] !== "number") throw new Error("Dữ liệu thanh toán không hợp lệ.");
    sorted[encodeURIComponent(key)] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
};

module.exports.signVNPay = (params) => crypto.createHmac("sha512", process.env.VNPAY_SECRET).update(qs.stringify(module.exports.sortObject(params), { encode: false })).digest("hex");
module.exports.verifyVNPay = (query) => {
  if(!process.env.VNPAY_SECRET) return false;
  const { vnp_SecureHash, vnp_SecureHashType, ...params } = query;
  try { return module.exports.safeEqual(vnp_SecureHash, module.exports.signVNPay(params)); } catch { return false; }
};

module.exports.settle = async (provider, reference, amount, success, transaction) => mongoose.connection.transaction(async session => {
  const payment = await Payment.findOne({ reference, provider }).session(session);
  if(!payment) return { code: "01", message: "Không tìm thấy giao dịch" };
  const order = await Order.findById(payment.orderId).session(session);
  if(!order || order.deleted) return { code: "01", message: "Không tìm thấy đơn hàng" };
  if(!Number.isSafeInteger(amount) || amount !== payment.amount || amount !== order.total) return { code: "04", message: "Số tiền không hợp lệ" };
  if(payment.status === "paid") return { code: "02", message: "Đã ghi nhận giao dịch", order };
  payment.providerTransaction = String(transaction || "");
  if(success) {
    payment.status = "paid";
    payment.paidAt = new Date();
    const late = order.reservationExpiresAt && order.reservationExpiresAt <= new Date() && order.paymentStatus !== "paid";
    if(late && order.status === "initial") {
      await bookingHelper.release(order, session);
      order.status = "cancel";
    }
    if(order.status === "cancel" || order.stockReleased || order.paymentStatus === "paid") order.paymentReview = true;
    order.paymentStatus = "paid";
    order.paidAttempt = order.paidAttempt || payment.reference;
    order.paidAt = order.paidAt || payment.paidAt;
    await order.save({ session });
  } else {
    payment.status = "failed";
  }
  await payment.save({ session });
  return { code: "00", message: "Đã xử lý", order };
});
