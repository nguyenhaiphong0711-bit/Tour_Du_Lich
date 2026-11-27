const Tour = require("../../models/tour.model");
const Category = require("../../models/category.model");
const categoryHelper = require("../../helpers/category.helper");
const tourHelper = require("../../helpers/tour.helper");

module.exports.home = async (req, res) => {
  const find = await tourHelper.visibleFilter();

  // Danh sách tour
  const tourListSection2 = await Tour
    .find(find)
    .sort({
      position: "desc",
      _id: 1
    })
    .limit(6);

  tourHelper.decorate(tourListSection2);
  // Hết Danh sách tour

  // Danh mục hiển thị ở trang chủ
  const categories = await Category
    .find({
      deleted: false,
      status: "active",
      parent: {
        $in: ["", null]
      }
    })
    .sort({
      position: -1,
      _id: 1
    });

  const featuredId = req.settingWebsiteInfo.categoryIdSection4;
  const existFeatured = categories.some(item => item.id === featuredId);

  if(featuredId && !existFeatured) {
    const featured = await Category.findOne({
      _id: featuredId,
      deleted: false,
      status: "active"
    });
    const visibleCategoryIds = await categoryHelper.visibleIds();

    if(featured && visibleCategoryIds.includes(featured.id)) {
      categories.unshift(featured);
    }
  }

  categories.sort((a, b) => Number(b.id === featuredId) - Number(a.id === featuredId));

  const categorySections = [];
  for(const category of categories) {
    const categoryChild = await categoryHelper.getCategoryChild(category.id);
    const categoryChildIds = categoryChild.map(item => item.id);

    const tours = await Tour
      .find({
        ...find,
        category: {
          $in: [category.id, ...categoryChildIds]
        }
      })
      .sort({
        position: -1,
        _id: 1
      })
      .limit(8);

    categorySections.push({
      category: category,
      tours: tourHelper.decorate(tours)
    });
  }
  // Hết Danh mục hiển thị ở trang chủ

  res.render("client/pages/home", {
    pageTitle: "Trang chủ",
    tourListSection2: tourListSection2,
    categorySections: categorySections
  });
};
