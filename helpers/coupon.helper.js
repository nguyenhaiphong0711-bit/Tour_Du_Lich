const Coupon = require("../models/coupon.model");

module.exports.discount = async (code, total, session) => {
  if(!code) return 0;
  let query = Coupon.findOne({ code: String(code).trim().toUpperCase(), status: "active", expiresAt: { $gt: new Date() } });
  if(session) query = query.session(session);
  const coupon = await query;
  if(!coupon || total < coupon.minTotal) throw new Error("Mã giảm giá không hợp lệ, đã hết hạn hoặc chưa đủ giá trị đơn tối thiểu.");
  const discount = Math.floor(total * coupon.percent / 100);
  return Math.min(total, coupon.maxDiscount > 0 ? Math.min(discount, coupon.maxDiscount) : discount);
};
