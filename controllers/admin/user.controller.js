const Order = require("../../models/order.model");
const { escapeRegex } = require("../../helpers/data.helper");
module.exports.list = async (req, res) => {
  const pipeline = [ { $match: { deleted: false } }, { $sort: { createdAt: -1 } },
    { $group: { _id: "$phone", fullName: { $first: "$fullName" }, orderCount: { $sum: 1 },
      paidTotal: { $sum: { $cond: [{ $and: [{ $eq: ["$paymentStatus", "paid"] }, { $ne: ["$status", "cancel"] }] }, "$total", 0] } }, lastOrder: { $first: "$createdAt" } } } ];
  if(req.query.keyword) pipeline.push({ $match: { $or: [{ fullName: new RegExp(escapeRegex(String(req.query.keyword).slice(0, 100)), "i") }, { _id: new RegExp(escapeRegex(String(req.query.keyword).slice(0, 100)), "i") }] } });
  const [count] = await Order.aggregate([...pipeline, { $count: "count" }]);
  const totalRecord = count?.count || 0;
  const limit = 12;
  const totalPage = Math.max(1, Math.ceil(totalRecord / limit));
  const page = Math.min(totalPage, Math.max(1, parseInt(req.query.page) || 1));
  const customerList = await Order.aggregate([...pipeline, { $sort: { lastOrder: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }]);
  res.render("admin/pages/user-list", { pageTitle: "Khách hàng", customerList: customerList, listCount: customerList.length,
    pagination: { page, limit, skip: (page - 1) * limit, totalRecord, totalPage: totalPage } });
};
