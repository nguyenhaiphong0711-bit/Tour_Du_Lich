const AccountAdmin = require("../../models/account-admin.model");
const Order = require("../../models/order.model");

module.exports.dashboard = async (req, res) => {
  // Thông số tổng quan
  const overview = {
    totalAdmin: 0,
    totalOrder: 0,
    totalRevenue: 0,
  };

  overview.totalAdmin = await AccountAdmin.countDocuments({
    deleted: false
  })

  const orderList = await Order.find({
    deleted: false
  })
  overview.totalOrder = orderList.length;
  overview.totalRevenue = orderList.reduce((total, item) => total + (item.paymentStatus === "paid" && item.status !== "cancel" ? item.total : 0), 0);
  // Hết Thông số tổng quan

  res.render("admin/pages/dashboard", {
    pageTitle: "Tổng quan",
    overview: overview,
    recentOrders: await Order.find({ deleted: false }).sort({ createdAt: -1 }).limit(5),
    statusList: require("../../config/variable.config").statusList,
    moment: require("moment")
  });
}

module.exports.revenueChartPost = async (req, res) => {
  const { currentMonth, currentYear, prevMonth, prevYear, arrayDay } = req.body;
  if(![currentMonth, prevMonth].every(month => Number.isInteger(month) && month >= 1 && month <= 12) || ![currentYear, prevYear].every(year => Number.isInteger(year) && year >= 2000 && year <= 2100) || !Array.isArray(arrayDay) || arrayDay.length > 31 || arrayDay.some(day => !Number.isInteger(day) || day < 1 || day > 31)) {
    return res.status(400).json({ code: "error", message: "Khoảng thời gian không hợp lệ." });
  }

  // Truy vấn tất cả đơn hàng trong tháng hiện tại
  const orderListCurrentMonth = await Order
    .find({
      deleted: false,
      paymentStatus: "paid", status: { $ne: "cancel" },
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1),
      }
    })

  // Truy vấn tất cả đơn hàng trong tháng trước
  const orderListPrevMonth = await Order
    .find({
      deleted: false,
      paymentStatus: "paid", status: { $ne: "cancel" },
      createdAt: {
        $gte: new Date(prevYear, prevMonth - 1, 1),
        $lt: new Date(prevYear, prevMonth, 1),
      }
    })

  // Tạo mảng doanh thu theo từng ngày
  const dataCurrentMonth = [];
  const dataPrevMonth = [];

  for (const day of arrayDay) {
    // Tính doanh thu từng ngày của tháng hiện tại
    let revenueCurrent = 0;
    for (const order of orderListCurrentMonth) {
      const orderDay = new Date(order.createdAt).getDate();
      if(day == orderDay) {
        revenueCurrent += order.total;
      }
    }
    dataCurrentMonth.push(revenueCurrent);

    // Tính doanh thu từng ngày của tháng trước
    let revenuePrev = 0;
    for (const order of orderListPrevMonth) {
      const orderDay = new Date(order.createdAt).getDate();
      if(day == orderDay) {
        revenuePrev += order.total;
      }
    }
    dataPrevMonth.push(revenuePrev);
  }

  res.json({
    code: "success",
    message: "Thành công!",
    dataCurrentMonth: dataCurrentMonth,
    dataPrevMonth: dataPrevMonth
  })
}
