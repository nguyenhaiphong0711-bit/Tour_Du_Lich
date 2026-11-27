const Order = require("../../models/order.model");

module.exports.dashboard = async (req, res) => {
  const visibleCategories = await require("../../helpers/category.helper").visibleIds();
  const [totals] = await Order.aggregate([
    { $match: { deleted: false } },
    { $group: {
      _id: null,
      totalOrder: { $sum: 1 },
      totalRevenue: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "paid"] }, { $ne: ["$status", "cancel"] }] }, "$total", 0] } },
      pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "initial"] }, 1, 0] } },
      doneOrders: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
      cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancel"] }, 1, 0] } }
    } }
  ]);
  const overview = { totalOrder: 0, totalRevenue: 0, pendingOrders: 0, doneOrders: 0, cancelledOrders: 0, ...totals };
  overview.activeTours = await require("../../models/tour.model").countDocuments({
    deleted: false, status: "active", category: { $in: visibleCategories },
    departureDate: { $gte: require("moment")().startOf("day").toDate() },
    $or: [{ stockAdult: { $gt: 0 } }, { stockChildren: { $gt: 0 } }, { stockBaby: { $gt: 0 } }]
  });

  res.render("admin/pages/dashboard", {
    pageTitle: "Tổng quan",
    overview: overview,
    recentOrders: req.permissions.includes("order-view") ? await Order.find({ deleted: false }).sort({ createdAt: -1 }).limit(5) : [],
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
      $or: [
        { paidAt: { $gte: new Date(currentYear, currentMonth - 1, 1), $lt: new Date(currentYear, currentMonth, 1) } },
        { paidAt: null, createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1), $lt: new Date(currentYear, currentMonth, 1) } }
      ]
    })

  // Truy vấn tất cả đơn hàng trong tháng trước
  const orderListPrevMonth = await Order
    .find({
      deleted: false,
      paymentStatus: "paid", status: { $ne: "cancel" },
      $or: [
        { paidAt: { $gte: new Date(prevYear, prevMonth - 1, 1), $lt: new Date(prevYear, prevMonth, 1) } },
        { paidAt: null, createdAt: { $gte: new Date(prevYear, prevMonth - 1, 1), $lt: new Date(prevYear, prevMonth, 1) } }
      ]
    })

  // Tạo mảng doanh thu theo từng ngày
  const dataCurrentMonth = [];
  const dataPrevMonth = [];

  for (const day of arrayDay) {
    // Tính doanh thu từng ngày của tháng hiện tại
    let revenueCurrent = 0;
    for (const order of orderListCurrentMonth) {
      const orderDay = new Date(order.paidAt || order.createdAt).getDate();
      if(day == orderDay) {
        revenueCurrent += order.total;
      }
    }
    dataCurrentMonth.push(revenueCurrent);

    // Tính doanh thu từng ngày của tháng trước
    let revenuePrev = 0;
    for (const order of orderListPrevMonth) {
      const orderDay = new Date(order.paidAt || order.createdAt).getDate();
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
