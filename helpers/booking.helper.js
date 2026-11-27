const mongoose = require("mongoose");
const Tour = require("../models/tour.model");
const Order = require("../models/order.model");
const City = require("../models/city.model");
const { generateRandomNumber } = require("./generate.helper");
const categoryHelper = require("./category.helper");
const couponHelper = require("./coupon.helper");
const { schema } = require("../validates/client/order.validate");

module.exports.create = async (body) => {
  const { error, value } = schema.validate(body, { convert: false });
  if(error) throw new Error("Thông tin đặt tour không hợp lệ. Kiểm tra số lượng, số điện thoại và phương thức thanh toán.");
  await module.exports.releaseExpired();
  const visibleIds = await categoryHelper.visibleIds();
  return mongoose.connection.transaction(async session => {
    const items = [];
    let subTotal = 0;
    for (const item of value.items) {
      const city = await City.findById(item.locationFrom).session(session);
      if(!city) throw new Error("Điểm khởi hành không tồn tại.");
      const tour = await Tour.findOneAndUpdate({
        _id: item.tourId, category: { $in: visibleIds }, deleted: false, status: "active",
        departureDate: { $gte: require("moment")().startOf("day").toDate() }, locations: item.locationFrom,
        stockAdult: { $gte: item.quantityAdult }, stockChildren: { $gte: item.quantityChildren }, stockBaby: { $gte: item.quantityBaby }
      }, { $inc: { stockAdult: -item.quantityAdult, stockChildren: -item.quantityChildren, stockBaby: -item.quantityBaby } }, { session, new: true });
      if(!tour) throw new Error("Tour đã hết chỗ, ngừng hoạt động, quá ngày đi hoặc không có điểm khởi hành đã chọn.");
      const prices = [tour.priceNewAdult, tour.priceNewChildren, tour.priceNewBaby];
      if(prices.some(price => !Number.isSafeInteger(price) || price < 0)) throw new Error("Giá tour chưa hợp lệ.");
      subTotal += item.quantityAdult * prices[0] + item.quantityChildren * prices[1] + item.quantityBaby * prices[2];
      items.push({ ...item, priceNewAdult: prices[0], priceNewChildren: prices[1], priceNewBaby: prices[2],
        departureDate: tour.departureDate, name: tour.name, avatar: tour.avatar, slug: tour.slug, cityName: city.name });
    }
    if(!Number.isSafeInteger(subTotal) || subTotal <= 0) throw new Error("Tổng giá trị đơn hàng không hợp lệ.");
    const discount = await couponHelper.discount(value.couponCode, subTotal, session);
    if(discount >= subTotal && ["vnpay", "zalopay"].includes(value.paymentMethod)) throw new Error("Đơn miễn phí vui lòng chọn thanh toán tiền mặt.");
    const orders = await Order.create([{ fullName: value.fullName, phone: value.phone, note: value.note, paymentMethod: value.paymentMethod,
      code: "OD" + generateRandomNumber(16), items, subTotal, discount, total: subTotal - discount,
      couponCode: value.couponCode?.toUpperCase(), reservationExpiresAt: ["vnpay", "zalopay"].includes(value.paymentMethod) ? new Date(Date.now() + 30 * 60 * 1000) : undefined }], { session });
    return orders[0];
  });
};

module.exports.release = async (order, session) => {
  if(order.stockReleased) return;
  for (const item of order.items) {
    await Tour.updateOne({ _id: item.tourId }, { $inc: {
      stockAdult: Number(item.quantityAdult) || 0, stockChildren: Number(item.quantityChildren) || 0, stockBaby: Number(item.quantityBaby) || 0
    } }, { session });
  }
  order.stockReleased = true;
};

module.exports.releaseExpired = async () => {
  const orders = await Order.find({ status: "initial", paymentStatus: "unpaid", stockReleased: { $ne: true }, reservationExpiresAt: { $lte: new Date() } }).select("_id").limit(100);
  for (const item of orders) {
    await mongoose.connection.transaction(async session => {
      const order = await Order.findOne({ _id: item.id, status: "initial", paymentStatus: "unpaid", stockReleased: { $ne: true }, reservationExpiresAt: { $lte: new Date() } }).session(session);
      if(!order) return;
      await module.exports.release(order, session);
      order.status = "cancel";
      await order.save({ session });
    });
  }
};
