const Tour = require("../../models/tour.model");
const Category = require("../../models/category.model");
const categoryHelper = require("../../helpers/category.helper");
const tourHelper = require("../../helpers/tour.helper");
const moment = require("moment");

module.exports.home = async (req, res) => {
  const find = await tourHelper.visibleFilter();
  const tourListSection2 = tourHelper.decorate(await Tour.find({ ...find,
    departureDate: { $gte: moment().startOf("day").toDate(), $lte: moment().add(30, "days").endOf("day").toDate() },
    $expr: { $lt: ["$priceNewAdult", "$priceAdult"] }
  }).sort({ departureDate: 1, position: -1 }).limit(6));
  const categories = await Category.find({ deleted: false, status: "active", parent: { $in: ["", null] } }).sort({ position: -1, _id: 1 });
  const featuredId = req.settingWebsiteInfo.categoryIdSection4;
  if(featuredId && !categories.some(item => item.id === featuredId)) {
    const featured = await Category.findOne({ _id: featuredId, deleted: false, status: "active" });
    if(featured && (await categoryHelper.visibleIds()).includes(featured.id)) categories.unshift(featured);
  }
  categories.sort((a, b) => Number(b.id === featuredId) - Number(a.id === featuredId));
  const categorySections = [];
  for (const category of categories) {
    const ids = [category.id, ...(await categoryHelper.getCategoryChild(category.id)).map(item => item.id)];
    const tours = await Tour.find({ ...find, category: { $in: ids } }).sort({ position: -1, _id: 1 }).limit(8);
    categorySections.push({ category, tours: tourHelper.decorate(tours) });
  }
  res.render("client/pages/home", { pageTitle: "Trang chủ", tourListSection2, categorySections });
};
