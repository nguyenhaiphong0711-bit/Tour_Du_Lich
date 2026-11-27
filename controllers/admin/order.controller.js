const mongoose = require("mongoose");
const Joi = require("joi");
const bookingHelper = require("../../helpers/booking.helper");
const { pick, pagination, escapeRegex } = require("../../helpers/data.helper");
const Order = require("../../models/order.model");
const City = require("../../models/city.model");
const { paymentMethodList, paymentStatusList, statusList } = require("../../config/variable.config");
const moment = require("moment");

module.exports.list = async (req, res) => {
  const find = { deleted: false };
  if(["initial", "done", "cancel"].includes(req.query.status)) find.status = req.query.status;
  if(req.query.keyword) find.$or = ["code", "fullName", "phone"].map(field => ({ [field]: new RegExp(escapeRegex(String(req.query.keyword).slice(0, 100)), "i") }));
  const pageInfo = await pagination(Order, find, req.query);
  const orderList = await Order.find(find).sort({ createdAt: -1, _id: -1 }).skip(pageInfo.skip).limit(pageInfo.limit);

  for (const orderDetail of orderList) {
    orderDetail.paymentMethodName = paymentMethodList.find(item => item.value == orderDetail.paymentMethod)?.label || "Chưa xác định";
    orderDetail.paymentStatusName = paymentStatusList.find(item => item.value == orderDetail.paymentStatus)?.label || "Chưa xác định";
    orderDetail.statusInfo = statusList.find(item => item.value == orderDetail.status) || { label: "Chưa xác định", color: "orange" };
    orderDetail.createdAtTime = moment(orderDetail.createdAt).format("HH:mm");
    orderDetail.createdAtDate = moment(orderDetail.createdAt).format("DD/MM/YYYY");
  }

  res.render("admin/pages/order-list", {
    pageTitle: "Quản lý đơn hàng",
    pagination: pageInfo,
    listCount: orderList.length,
    orderList: orderList
  });
}

module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;

    const orderDetail = await Order.findOne({
      _id: id,
      deleted: false
    })

    if(!orderDetail) {
      res.redirect(`/${pathAdmin}/order/list`);
      return;
    }

    orderDetail.createdAtFormat = moment(orderDetail.createdAt).format("YYYY-MM-DDTHH:mm");

    for (const item of orderDetail.items) {
      item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
      const city = !item.cityName && mongoose.isValidObjectId(item.locationFrom) ? await City.findById(item.locationFrom) : null;
      item.cityName = item.cityName || city?.name || "Chưa xác định";
    }

    res.render("admin/pages/order-edit", {
      pageTitle: `Đơn hàng: ${orderDetail.code}`,
      payments: await require("../../models/payment.model").find({ orderId: id }).sort({ createdAt: -1 }),
      orderDetail: orderDetail,
      paymentMethodList: paymentMethodList,
      paymentStatusList: paymentStatusList,
      statusList: statusList
    });
  } catch (error) {
    res.redirect(`/${pathAdmin}/order/list`);
  }
}

module.exports.editPatch = async (req, res) => {
  try {
    const data = pick(req.body, ["fullName", "phone", "note", "paymentMethod", "paymentStatus", "status"]);
    const { error } = Joi.object({ fullName: Joi.string().trim().min(2).max(80).required(), phone: Joi.string().pattern(/^0[0-9]{9}$/).required(), note: Joi.string().max(2000).allow(""),
      paymentMethod: Joi.string().valid("money", "bank", "vnpay", "zalopay", "momo").required(), paymentStatus: Joi.string().valid("paid", "unpaid").required(), status: Joi.string().valid("initial", "done", "cancel").required() }).validate(data);
    if(error) throw new Error("Thông tin đơn hàng không hợp lệ.");
    await mongoose.connection.transaction(async session => {
      const order = await Order.findOne({ _id: req.params.id, deleted: false }).session(session);
      if(!order) throw new Error("Đơn hàng không tồn tại.");
      if(order.status === "cancel" && data.status !== "cancel") throw new Error("Đơn đã hủy không thể mở lại. Vui lòng tạo đơn mới để kiểm tra chỗ.");
      if(["vnpay", "zalopay"].includes(order.paymentMethod) && (data.paymentMethod !== order.paymentMethod || data.paymentStatus !== order.paymentStatus)) throw new Error("Thanh toán trực tuyến được cập nhật qua cổng thanh toán.");
      if(data.paymentMethod !== order.paymentMethod) throw new Error("Không đổi phương thức thanh toán của đơn đã tạo.");
      if(order.paymentStatus === "paid" && data.paymentStatus !== "paid") throw new Error("Đơn đã thanh toán cần được đối soát hoàn tiền riêng.");
      if(data.status === "done" && data.paymentStatus !== "paid") throw new Error("Cần xác nhận thanh toán trước khi hoàn thành.");
      if(data.status === "cancel" && order.status !== "cancel") {
        await bookingHelper.release(order, session);
      }
      if(data.status === "cancel" && data.paymentStatus === "paid") order.paymentReview = true;
      if(order.paymentStatus !== "paid" && data.paymentStatus === "paid") order.paidAt = new Date();
      Object.assign(order, data, { updatedBy: req.account.id });
      await order.save({ session });
    });
    res.json({ code: "success", message: "Cập nhật đơn hàng thành công!" });
  } catch (error) {
    res.status(400).json({ code: "error", message: error.message });
  }
};
