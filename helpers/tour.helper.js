const categoryHelper = require("./category.helper");
const moment = require("moment");
module.exports.visibleFilter = async () => ({ deleted: false, status: "active", category: { $in: await categoryHelper.visibleIds() },
  departureDate: { $gte: moment().startOf("day").toDate() }, $or: [{ stockAdult: { $gt: 0 } }, { stockChildren: { $gt: 0 } }, { stockBaby: { $gt: 0 } }] });
module.exports.decorate = (tours) => {
  for (const item of tours) {
    item.discount = item.priceAdult > 0 ? Math.max(0, Math.floor((item.priceAdult - item.priceNewAdult) / item.priceAdult * 100)) : 0;
    item.departureDateFormat = item.departureDate ? moment(item.departureDate).format("DD/MM/YYYY") : "Đang cập nhật";
  }
  return tours;
};
