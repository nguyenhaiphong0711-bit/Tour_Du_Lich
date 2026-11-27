const Category = require("../../models/category.model");
const AccountAdmin = require("../../models/account-admin.model");
const categoryHelper = require("../../helpers/category.helper");
const moment = require('moment');
const slugify = require('slugify');

module.exports.list = async (req, res) => {
  const find = {
    deleted: false
  };

  // Lọc theo Trạng thái
  if(["active", "inactive"].includes(req.query.status)) {
    find.status = req.query.status;
  }
  // Hết Lọc theo Trạng thái

  // Lọc theo Người tạo
  if(/^[a-f0-9]{24}$/i.test(req.query.createdBy || "")) {
    find.createdBy = req.query.createdBy;
  }
  // Hết Lọc theo Người tạo

  // Lọc theo Ngày tạo
  const filterDate = {};
  if(moment(req.query.startDate, "YYYY-MM-DD", true).isValid()) {
    const startDate = moment(req.query.startDate).toDate();
    filterDate.$gte = startDate;
    find.createdAt = filterDate;
  }
  if(moment(req.query.endDate, "YYYY-MM-DD", true).isValid()) {
    const endDate = moment(req.query.endDate).endOf("day").toDate();
    filterDate.$lte = endDate;
    find.createdAt = filterDate;
  }
  // Hết Lọc theo Ngày tạo

  // Tìm kiếm
  if(req.query.keyword) {
    const keyword = slugify(req.query.keyword);
    const keywordRegex = new RegExp(require("../../helpers/data.helper").escapeRegex(keyword), "i");
    find.slug = keywordRegex;
  }
  // Hết Tìm kiếm

  // Phân trang
  const pagination = await require("../../helpers/data.helper").pagination(Category, find, req.query);
  const { limit: limitItems, page, skip } = pagination;
  // Hết Phân trang

  const categoryList = await Category
    .find(find)
    .sort({
      position: "desc"
    })
    .limit(limitItems)
    .skip(skip)

  const authorIds = [...new Set(categoryList.flatMap(item => [item.createdBy, item.updatedBy, item.deletedBy]).filter(id => /^[a-f0-9]{24}$/i.test(id || "")))];
  const authors = new Map((await AccountAdmin.find({ _id: { $in: authorIds } }).select("fullName")).map(item => [item.id, item]));
  for (const item of categoryList) {
    if(item.createdBy) {
      const infoAccount = authors.get(item.createdBy)
      if(infoAccount) {
        item.createdByFullName = infoAccount.fullName;
      }
    }

    if(item.updatedBy) {
      const infoAccount = authors.get(item.updatedBy)
      if(infoAccount) {
        item.updatedByFullName = infoAccount.fullName;
      }
    }

    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
    item.updatedAtFormat = moment(item.updatedAt).format("HH:mm - DD/MM/YYYY");
  }

  // Danh sách tài khoản admin
  const accountAdminList = await AccountAdmin.find({});
  // Hết Danh sách tài khoản admin

  res.render("admin/pages/category-list", {
    pageTitle: "Quản lý danh mục",
    categoryList: categoryList,
    accountAdminList: accountAdminList,
    listCount: categoryList.length,
    pagination: pagination
  });
}

module.exports.create = async (req, res) => {
  const categoryList = await Category.find({ deleted: false }).sort({ position: -1, _id: 1 });

  const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");

  res.render("admin/pages/category-create", {
    pageTitle: "Tạo danh mục",
    categoryList: categoryTree
  });
}

module.exports.createPost = async (req, res) => {
  if(req.body.position) {
    req.body.position = parseInt(req.body.position);
  } else {
    const totalRecord = await Category.countDocuments({});
    req.body.position = totalRecord + 1;
  }

  req.body.createdBy = req.account.id;
  req.body.updatedBy = req.account.id;
  req.body.avatar = req.file ? req.file.path : "";

  const newRecord = new Category(req.body);
  await newRecord.save();

  res.json({
    code: "success",
    message: "Tạo danh mục thành công!"
  })
}

module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;

    const categoryDetail = await Category.findOne({
      _id: id,
      deleted: false
    })

    if(!categoryDetail) {
      res.redirect(`/${pathAdmin}/category/list`);
      return;
    }

    const categoryList = await Category.find({ deleted: false }).sort({ position: -1, _id: 1 });

    const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");

    res.render("admin/pages/category-edit", {
      pageTitle: "Chỉnh sửa danh mục",
      categoryList: categoryTree,
      categoryDetail: categoryDetail
    });
  } catch (error) {
    res.redirect(`/${pathAdmin}/category/list`);
  }
}

module.exports.editPatch = async (req, res) => {
  try {
    const id = req.params.id;

    if(req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      delete req.body.position;
    }

    req.body.updatedBy = req.account.id;
    if(req.file) {
      req.body.avatar = req.file.path;
    } else if(req.body.clearAvatar === "true") {
      req.body.avatar = "";
    } else {
      delete req.body.avatar;
    }
    delete req.body.clearAvatar;

    const result = await Category.updateOne({ _id: id, deleted: false }, req.body);
    if(!result.matchedCount) return res.status(404).json({ code: "error", message: "Danh mục không tồn tại hoặc đã xóa." });

    res.json({
      code: "success",
      message: "Cập nhật thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

module.exports.deletePatch = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Category.updateOne({
      _id: id, deleted: false
    }, {
      deleted: true,
      deletedAt: Date.now(),
      deletedBy: req.account.id
    });

    if(!result.matchedCount) return res.status(404).json({ code: "error", message: "Danh mục không tồn tại hoặc đã xóa." });
    res.json({
      code: "success",
      message: "Xóa danh mục thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

module.exports.changeMultiPatch = async (req, res) => {
  try {
    const { value, ids } = req.body;
    const action = ["active", "inactive"].includes(value) ? "edit" : ["undo"].includes(value) ? "trash" : "delete";
    if(!req.permissions.includes("category-" + action)) return res.status(403).json({ code: "error", message: "Không có quyền!" });
    if(!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => !/^[a-f0-9]{24}$/i.test(id))) {
      return res.status(400).json({ code: "error", message: "Chọn từ 1 đến 100 bản ghi hợp lệ." });
    }

    switch (value) {
      case "active":
      case "inactive":
        await Category.updateMany({
          _id: { $in: ids }
        }, {
          status: value
        })
        res.json({
          code: "success",
          message: "Đổi trạng thái thành công!"
        })
        break;
      case "delete":
        await Category.updateMany({
          _id: { $in: ids }
        }, {
          deleted: true,
          deletedAt: Date.now(),
          deletedBy: req.account.id
        })
        res.json({
          code: "success",
          message: "Đã xóa thành công!"
        })
        break;
      default:
        res.json({
          code: "error",
          message: "Dữ liệu không hợp lệ!"
        })
        break;
    }
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}
