const Category = require("../../models/category.model");
const categoryHelper = require("../../helpers/category.helper");

module.exports.list = async (req, res, next) => {
  const categoryList = await Category.find({
      deleted: false,
      status: "active"
    })
    .sort({
      position: -1,
      _id: 1
    });

  const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");

  res.locals.categoryList = categoryTree;

  next();
}
