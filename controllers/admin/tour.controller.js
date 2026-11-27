const { pagination, escapeRegex } = require("../../helpers/data.helper");
const Category = require("../../models/category.model");
const categoryHelper = require("../../helpers/category.helper");
const City = require("../../models/city.model");
const Tour = require("../../models/tour.model");
const AccountAdmin = require("../../models/account-admin.model");
const moment = require('moment');

module.exports.list = async (req, res) => {
  const find = { deleted: false };
  if(["active", "inactive"].includes(req.query.status)) find.status = req.query.status;
  if(/^[a-f0-9]{24}$/i.test(req.query.category || "")) find.category = req.query.category;
  if(/^[a-f0-9]{24}$/i.test(req.query.createdBy || "")) find.createdBy = req.query.createdBy;
  if(req.query.keyword) find.name = new RegExp(escapeRegex(String(req.query.keyword).slice(0, 100)), "i");
  if(req.query.startDate || req.query.endDate) {
    find.createdAt = {};
    if(moment(req.query.startDate, "YYYY-MM-DD", true).isValid()) find.createdAt.$gte = moment(req.query.startDate).startOf("day").toDate();
    if(moment(req.query.endDate, "YYYY-MM-DD", true).isValid()) find.createdAt.$lte = moment(req.query.endDate).endOf("day").toDate();
  }

  if(find.createdAt && !Object.keys(find.createdAt).length) delete find.createdAt;
  const pageInfo = await pagination(Tour, find, req.query);
  const tourList = await Tour.find(find).sort({ position: -1, _id: 1 }).skip(pageInfo.skip).limit(pageInfo.limit);

  const authorIds = [...new Set(tourList.flatMap(item => [item.createdBy, item.updatedBy, item.deletedBy]).filter(id => /^[a-f0-9]{24}$/i.test(id || "")))];
  const authors = new Map((await AccountAdmin.find({ _id: { $in: authorIds } }).select("fullName")).map(item => [item.id, item]));
  for (const item of tourList) {
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
    item.updatedAtDate = moment(item.updatedAt).format("DD/MM/YYYY");
    item.departureDateFormat = item.departureDate ? moment(item.departureDate).format("DD/MM/YYYY") : "";
  }

  const categoryList = await Category.find({ deleted: false }).sort({ position: -1 });
  const [total, active, inactive] = await Promise.all([
    Tour.countDocuments({ deleted: false }),
    Tour.countDocuments({ deleted: false, status: "active" }),
    Tour.countDocuments({ deleted: false, status: "inactive" })
  ]);
  const bulkActions = [];
  if(req.permissions.includes("tour-edit")) bulkActions.push({ label: "Hoạt động", value: "active" }, { label: "Tạm dừng", value: "inactive" });
  if(req.permissions.includes("tour-delete")) bulkActions.push({ label: "Chuyển vào thùng rác", value: "delete" });
  res.render("admin/pages/tour-list", {
    pageTitle: "Quản lý tour",
    categoryList: categoryList,
    categoryNames: Object.fromEntries(categoryList.map(item => [item.id, item.name])),
    summary: { total, active, inactive },
    bulkActions: bulkActions,
    accountAdminList: await AccountAdmin.find({ deleted: false }).select("fullName"),
    pagination: pageInfo,
    listCount: tourList.length,
    tourList: tourList
  });
}

module.exports.create = async (req, res) => {
  const categoryList = await Category.find({ deleted: false }).sort({ position: -1, _id: 1 });

  const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");

  const cityList = await City.find({});

  res.render("admin/pages/tour-create", {
    pageTitle: "Tạo tour",
    categoryList: categoryTree,
    cityList: cityList
  });
}

module.exports.trash = async (req, res) => {
  const find = {
    deleted: true
  };

  if(req.query.keyword) find.name = new RegExp(escapeRegex(String(req.query.keyword).slice(0, 100)), "i");
  const pageInfo = await pagination(Tour, find, req.query);
  const tourList = await Tour.find(find).sort({ deletedAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit);

  const authorIds = [...new Set(tourList.flatMap(item => [item.createdBy, item.updatedBy, item.deletedBy]).filter(id => /^[a-f0-9]{24}$/i.test(id || "")))];
  const authors = new Map((await AccountAdmin.find({ _id: { $in: authorIds } }).select("fullName")).map(item => [item.id, item]));
  for (const item of tourList) {
    if(item.createdBy) {
      const infoAccount = authors.get(item.createdBy)
      if(infoAccount) {
        item.createdByFullName = infoAccount.fullName;
      }
    }

    if(item.deletedBy) {
      const infoAccount = authors.get(item.deletedBy)
      if(infoAccount) {
        item.deletedByFullName = infoAccount.fullName;
      }
    }

    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
    item.deletedAtFormat = moment(item.deletedAt).format("HH:mm - DD/MM/YYYY");
  }

  res.render("admin/pages/tour-trash", {
    pageTitle: "Thùng rác tour",
    pagination: pageInfo, listCount: tourList.length,
    tourList: tourList
  });
}

module.exports.createPost = async (req, res) => {
  try {
    if(!req.permissions.includes("tour-create")) {
      res.json({
        code: "error",
        message: "Không có quyền!"
      })
      return;
    }

    if(req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      const totalRecord = await Tour.countDocuments({});
      req.body.position = totalRecord + 1;
    }

    req.body.priceAdult = req.body.priceAdult ? parseInt(req.body.priceAdult) : 0;
    req.body.priceChildren = req.body.priceChildren ? parseInt(req.body.priceChildren) : 0;
    req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;
    req.body.priceNewAdult = req.body.priceNewAdult !== "" && req.body.priceNewAdult !== undefined ? parseInt(req.body.priceNewAdult) : req.body.priceAdult;
    req.body.priceNewChildren = req.body.priceNewChildren !== "" && req.body.priceNewChildren !== undefined ? parseInt(req.body.priceNewChildren) : req.body.priceChildren;
    req.body.priceNewBaby = req.body.priceNewBaby !== "" && req.body.priceNewBaby !== undefined ? parseInt(req.body.priceNewBaby) : req.body.priceBaby;
    req.body.stockAdult = req.body.stockAdult ? parseInt(req.body.stockAdult) : 0;
    req.body.stockChildren = req.body.stockChildren ? parseInt(req.body.stockChildren) : 0;
    req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;
    req.body.locations = req.body.locations ? JSON.parse(req.body.locations) : [];
    req.body.departureDate = req.body.departureDate ? new Date(req.body.departureDate) : null;
    req.body.schedules = req.body.schedules ? JSON.parse(req.body.schedules) : [];

    req.body.createdBy = req.account.id;
    req.body.updatedBy = req.account.id;
    if(req.files && req.files.avatar && req.files.avatar.length > 0) {
      req.body.avatar = req.files.avatar[0].path;
    } else {
      req.body.avatar = "";
    }

    if(req.files && req.files.images && req.files.images.length > 0) {
      req.body.images = req.files.images.map(item => item.path);
    } else {
      req.body.images = [];
    }

    delete req.body.imageOrder;
    const newRecord = new Tour(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo tour thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;

    const tourDetail = await Tour.findOne({
      _id: id,
      deleted: false
    })

    if(!tourDetail) {
      res.redirect(`/${pathAdmin}/tour/list`);
      return;
    }

    if(tourDetail.departureDate) {
      tourDetail.departureDateFormat = moment(tourDetail.departureDate).format("YYYY-MM-DD");
    }

    const categoryList = await Category.find({ deleted: false }).sort({ position: -1, _id: 1 });

    const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");

    const cityList = await City.find({});

    res.render("admin/pages/tour-edit", {
      pageTitle: "Chỉnh sửa tour",
      categoryList: categoryTree,
      tourDetail: tourDetail,
      cityList: cityList
    });
  } catch (error) {
    res.redirect(`/${pathAdmin}/tour/list`);
  }
}

module.exports.editPatch = async (req, res) => {
  try {
    if(!req.permissions.includes("tour-edit")) {
      res.json({
        code: "error",
        message: "Không có quyền!"
      })
      return;
    }

    const id = req.params.id;
    const updatedAt = new Date(req.body.updatedAt);
    if(!req.body.updatedAt || Number.isNaN(updatedAt.getTime())) return res.status(400).json({ code: "error", message: "Vui lòng tải lại biểu mẫu trước khi lưu." });
    delete req.body.updatedAt;

    if(req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      delete req.body.position;
    }

    req.body.priceAdult = req.body.priceAdult ? parseInt(req.body.priceAdult) : 0;
    req.body.priceChildren = req.body.priceChildren ? parseInt(req.body.priceChildren) : 0;
    req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;
    req.body.priceNewAdult = req.body.priceNewAdult !== "" && req.body.priceNewAdult !== undefined ? parseInt(req.body.priceNewAdult) : req.body.priceAdult;
    req.body.priceNewChildren = req.body.priceNewChildren !== "" && req.body.priceNewChildren !== undefined ? parseInt(req.body.priceNewChildren) : req.body.priceChildren;
    req.body.priceNewBaby = req.body.priceNewBaby !== "" && req.body.priceNewBaby !== undefined ? parseInt(req.body.priceNewBaby) : req.body.priceBaby;
    req.body.stockAdult = req.body.stockAdult ? parseInt(req.body.stockAdult) : 0;
    req.body.stockChildren = req.body.stockChildren ? parseInt(req.body.stockChildren) : 0;
    req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;
    req.body.locations = req.body.locations ? JSON.parse(req.body.locations) : [];
    req.body.departureDate = req.body.departureDate ? new Date(req.body.departureDate) : null;
    req.body.schedules = req.body.schedules ? JSON.parse(req.body.schedules) : [];
    req.body.updatedBy = req.account.id;
    req.body.avatar = req.file ? req.file.path : "";
    if(req.files && req.files.avatar && req.files.avatar.length > 0) {
      req.body.avatar = req.files.avatar[0].path;
    } else if(req.body.clearAvatar === "true") {
      req.body.avatar = "";
    } else {
      delete req.body.avatar;
    }
    delete req.body.clearAvatar;

    const currentTour = await Tour.findOne({ _id: id, deleted: false });
    if(!currentTour || currentTour.updatedAt.getTime() !== updatedAt.getTime()) return res.status(409).json({ code: "error", message: "Tour vừa thay đổi hoặc có khách đặt chỗ. Vui lòng tải lại trang trước khi sửa." });
    const uploadedImages = (req.files?.images || []).map(item => item.path);
    if(req.body.imageOrder !== undefined) {
      const imageOrder = JSON.parse(req.body.imageOrder);
      const used = new Set();
      req.body.images = imageOrder.map(item => {
        if(used.has(item)) throw new Error("Ảnh bị trùng lặp.");
        used.add(item);
        if(typeof item === "string" && currentTour.images.includes(item)) return item;
        if(Number.isInteger(item) && item >= 0 && item < uploadedImages.length) return uploadedImages[item];
        throw new Error("Danh sách ảnh không hợp lệ.");
      });
      if(uploadedImages.some((image, index) => !used.has(index))) throw new Error("Danh sách ảnh thiếu tệp vừa tải lên.");
    } else if(uploadedImages.length) {
      req.body.images = uploadedImages;
    } else if(req.body.clearImages === "true") {
      req.body.images = [];
    } else {
      delete req.body.images;
    }
    delete req.body.imageOrder;
    delete req.body.clearImages;

    const result = await Tour.findOneAndUpdate({
      _id: id,
      deleted: false, updatedAt: updatedAt
    }, req.body, { new: true, runValidators: true });

    if(!result) return res.status(409).json({ code: "error", message: "Tour vừa thay đổi hoặc có khách đặt chỗ. Vui lòng tải lại trang trước khi sửa." });
    res.json({
      code: "success",
      message: "Cập nhật thành công!",
      updatedAt: result.updatedAt.toISOString(),
      avatar: result.avatar, images: result.images
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
    if(!req.permissions.includes("tour-delete")) {
      res.json({
        code: "error",
        message: "Không có quyền!"
      })
      return;
    }

    const id = req.params.id;

    const result = await Tour.updateOne({
      _id: id, deleted: false
    }, {
      deleted: true,
      deletedAt: Date.now(),
      deletedBy: req.account.id
    });

    if(!result.matchedCount) return res.status(404).json({ code: "error", message: "Tour không tồn tại trong danh sách này." });
    res.json({
      code: "success",
      message: "Xóa tour thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

module.exports.undoPatch = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Tour.updateOne({
      _id: id, deleted: true
    }, {
      deleted: false
    });

    if(!result.matchedCount) return res.status(404).json({ code: "error", message: "Tour không tồn tại trong danh sách này." });
    res.json({
      code: "success",
      message: "Đã khôi phục!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

module.exports.destroyDelete = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Tour.deleteOne({ _id: id, deleted: true });

    if(!result.deletedCount) return res.status(404).json({ code: "error", message: "Tour không tồn tại trong thùng rác." });
    res.json({
      code: "success",
      message: "Đã xóa vĩnh viễn!"
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
    if(!req.permissions.includes("tour-" + action)) return res.status(403).json({ code: "error", message: "Không có quyền!" });
    if(!Array.isArray(ids) || !ids.length || ids.length > 100 || ids.some(id => !/^[a-f0-9]{24}$/i.test(id))) {
      return res.status(400).json({ code: "error", message: "Chọn từ 1 đến 100 bản ghi hợp lệ." });
    }

    switch (value) {
      case "active":
      case "inactive":
        await Tour.updateMany({
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
        await Tour.updateMany({
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
      case "undo":
        await Tour.updateMany({
          _id: { $in: ids }
        }, {
          deleted: false
        })
        res.json({
          code: "success",
          message: "Đã khôi phục thành công!"
        })
        break;
      case "destroy":
        await Tour.deleteMany({ _id: { $in: ids }, deleted: true })
        res.json({
          code: "success",
          message: "Đã xóa vĩnh viễn!"
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
