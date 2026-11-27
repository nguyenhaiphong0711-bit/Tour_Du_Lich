const Order = require("../../models/order.model");
const Payment = require("../../models/payment.model");
const City = require("../../models/city.model");
const { paymentMethodList, paymentStatusList, statusList } = require("../../config/variable.config");
const bookingHelper = require("../../helpers/booking.helper");
const paymentHelper = require("../../helpers/payment.helper");
const { generateRandomNumber } = require("../../helpers/generate.helper");
const moment = require("moment");
const axios = require("axios");
const crypto = require("crypto");
const qs = require("qs");

module.exports.createPost = async (req, res) => {
  try {
    const order = await bookingHelper.create(req.body);
    res.json({ code: "success", message: "Đặt tour thành công!", orderCode: order.code, phone: order.phone });
  } catch (error) {
    res.status(400).json({ code: "error", message: error.message });
  }
};

const findOrder = async (req) => {
  const { orderCode, phone } = req.query;
  if(typeof orderCode !== "string" || typeof phone !== "string" || !orderCode || !phone) return null;
  return Order.findOne({ code: orderCode, phone, deleted: false });
};

module.exports.success = async (req, res) => {
  await bookingHelper.releaseExpired();
  const orderDetail = await findOrder(req);
  if(!orderDetail) return res.redirect("/");
  orderDetail.paymentMethodName = paymentMethodList.find(item => item.value === orderDetail.paymentMethod)?.label || "Chưa xác định";
  orderDetail.paymentStatusName = paymentStatusList.find(item => item.value === orderDetail.paymentStatus)?.label || "Chưa xác định";
  orderDetail.statusName = statusList.find(item => item.value === orderDetail.status)?.label || "Chưa xác định";
  orderDetail.createdAtFormat = moment(orderDetail.createdAt).format("HH:mm - DD/MM/YYYY");
  for (const item of orderDetail.items) {
    item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
    if(!item.cityName) item.cityName = (await City.findById(item.locationFrom).catch(() => null))?.name || "Chưa xác định";
  }
  res.render("client/pages/order-success", { pageTitle: "Thông tin đơn hàng", orderDetail });
};

const preparePayment = async (req, provider) => {
  await bookingHelper.releaseExpired();
  const order = await findOrder(req);
  if(!order || order.paymentMethod !== provider || order.paymentStatus === "paid" || order.status === "cancel" || order.total <= 0) throw new Error("Đơn hàng không thể thanh toán.");
  if(!process.env.WEBSITE_DOMAIN) throw new Error("Chưa cấu hình tên miền thanh toán.");
  const reference = provider === "zalopay" ? `${moment().utcOffset(7).format("YYMMDD")}_${generateRandomNumber(16)}` : generateRandomNumber(20);
  const payment = await Payment.create({ reference, orderId: order.id, provider, amount: order.total });
  return { order, payment };
};

module.exports.paymentZaloPay = async (req, res) => {
  try {
    if(!process.env.ZALOPAY_KEY1 || !process.env.ZALOPAY_KEY2 || !process.env.ZALOPAY_APPID || !process.env.ZALOPAY_DOMAIN) throw new Error("Chưa cấu hình ZaloPay.");
    const { order, payment } = await preparePayment(req, "zalopay");
    const data = {
      app_id: process.env.ZALOPAY_APPID, app_trans_id: payment.reference, app_user: order.code, app_time: Date.now(),
      item: JSON.stringify(order.items), amount: order.total, description: `Thanh toán ${order.code}`, bank_code: "",
      embed_data: JSON.stringify({ redirecturl: `${process.env.WEBSITE_DOMAIN}/order/success?orderCode=${order.code}&phone=${order.phone}` }),
      callback_url: `${process.env.WEBSITE_DOMAIN}/order/payment-zalopay-result`
    };
    const signData = [data.app_id, data.app_trans_id, data.app_user, data.amount, data.app_time, data.embed_data, data.item].join("|");
    data.mac = crypto.createHmac("sha256", process.env.ZALOPAY_KEY1).update(signData).digest("hex");
    const response = await axios.post(`${process.env.ZALOPAY_DOMAIN}/v2/create`, null, { params: data, timeout: 15000 });
    if(response.data.return_code !== 1 || !response.data.order_url) throw new Error("Không khởi tạo được thanh toán.");
    res.redirect(response.data.order_url);
  } catch (error) {
    res.status(400).render("client/pages/payment-error", { pageTitle: "Chưa thể thanh toán", message: "Chưa thể mở ZaloPay. Vui lòng kiểm tra thông tin đơn hàng hoặc thử lại sau." });
  }
};

module.exports.paymentZaloPayResultPost = async (req, res) => {
  try {
    if(!process.env.ZALOPAY_KEY2 || typeof req.body.data !== "string") throw new Error("Thiếu dữ liệu");
    const mac = crypto.createHmac("sha256", process.env.ZALOPAY_KEY2).update(req.body.data).digest("hex");
    if(!paymentHelper.safeEqual(req.body.mac, mac)) return res.json({ return_code: -1, return_message: "mac not equal" });
    const data = JSON.parse(req.body.data);
    if(String(data.app_id) !== process.env.ZALOPAY_APPID) return res.json({ return_code: -1, return_message: "invalid app" });
    const result = await paymentHelper.settle("zalopay", data.app_trans_id, Number(data.amount), true, data.zp_trans_id);
    res.json({ return_code: ["00", "02"].includes(result.code) ? 1 : -1, return_message: result.message });
  } catch (error) {
    res.json({ return_code: 0, return_message: "Không thể xử lý, vui lòng thử lại" });
  }
};

module.exports.paymentVNPay = async (req, res) => {
  try {
    if(!process.env.VNPAY_SECRET || !process.env.VNPAY_TMNCODE || !process.env.VNPAY_URL) throw new Error("Chưa cấu hình VNPay.");
    const { order, payment } = await preparePayment(req, "vnpay");
    const params = {
      vnp_Version: "2.1.0", vnp_Command: "pay", vnp_TmnCode: process.env.VNPAY_TMNCODE, vnp_Locale: "vn", vnp_CurrCode: "VND",
      vnp_TxnRef: payment.reference, vnp_OrderInfo: `Thanh toan ${order.code}`, vnp_OrderType: "other", vnp_Amount: order.total * 100,
      vnp_ReturnUrl: `${process.env.WEBSITE_DOMAIN}/order/payment-vnpay-result`, vnp_IpAddr: req.ip,
      vnp_CreateDate: moment().utcOffset(7).format("YYYYMMDDHHmmss"),
      vnp_ExpireDate: moment(order.reservationExpiresAt).utcOffset(7).format("YYYYMMDDHHmmss")
    };
    const sorted = paymentHelper.sortObject(params);
    sorted.vnp_SecureHash = paymentHelper.signVNPay(params);
    res.redirect(`${process.env.VNPAY_URL}?${qs.stringify(sorted, { encode: false })}`);
  } catch (error) {
    res.status(400).render("client/pages/payment-error", { pageTitle: "Chưa thể thanh toán", message: "Chưa thể mở VNPay. Vui lòng kiểm tra thông tin đơn hàng hoặc thử lại sau." });
  }
};

const processVNPay = async (query) => {
  if(!paymentHelper.verifyVNPay(query) || query.vnp_TmnCode !== process.env.VNPAY_TMNCODE) return { code: "97", message: "Chữ ký không hợp lệ" };
  return paymentHelper.settle("vnpay", query.vnp_TxnRef, Number(query.vnp_Amount) / 100,
    query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00", query.vnp_TransactionNo);
};
module.exports.paymentVNPayIpn = async (req, res) => {
  try {
    const result = await processVNPay(req.query);
    res.json({ RspCode: result.code, Message: result.message });
  } catch (error) {
    res.json({ RspCode: "99", Message: "Vui lòng thử lại" });
  }
};
module.exports.paymentVNPayResult = async (req, res) => {
  const result = await processVNPay(req.query);
  if(result.order) return res.redirect(`/order/success?orderCode=${result.order.code}&phone=${result.order.phone}`);
  res.status(400).render("client/pages/payment-error", { pageTitle: "Không thể xác nhận thanh toán", message: "Thông tin thanh toán không hợp lệ. Vui lòng liên hệ để đối soát." });
};
