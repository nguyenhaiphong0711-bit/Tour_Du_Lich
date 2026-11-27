const { pagination, escapeRegex, pick } = require("../../helpers/data.helper");
const Joi = require("joi");
const SettingWebsiteInfo = require("../../models/setting-website-info.model");
const { permissionList } = require("../../config/variable.config");
const Role = require("../../models/role.model");
const bcrypt = require("bcryptjs");
const AccountAdmin = require("../../models/account-admin.model");
const Category = require("../../models/category.model");
const categoryHelper = require("../../helpers/category.helper");

module.exports.list = async (req, res) => {
  res.render("admin/pages/setting-list", {
    pageTitle: "Cài đặt chung"
  });
}

module.exports.websiteInfo = async (req, res) => {
  const record = await SettingWebsiteInfo.findOne({}) || {};

  // Danh sách danh mục
  const categoryList = await Category.find({});
  const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");
  // Hết Danh sách danh mục

  res.render("admin/pages/setting-website-info", {
    pageTitle: "Thông tin website",
    record: record,
    categoryList: categoryTree
  });
}

module.exports.websiteInfoPatch = async (req, res) => {
  const clearLogo = req.body.clearLogo === "true", clearFavicon = req.body.clearFavicon === "true";
  req.body = pick(req.body, ["websiteName", "phone", "email", "address", "categoryIdSection4", "bankName", "bankAccountName", "bankAccountNumber"]);
  const validation = Joi.object({ websiteName: Joi.string().trim().min(2).max(150).required(), phone: Joi.string().max(30).allow(""), email: Joi.string().email().allow(""), address: Joi.string().max(500).allow(""), categoryIdSection4: Joi.string().hex().length(24).allow(""), bankName: Joi.string().max(100).allow(""), bankAccountName: Joi.string().max(100).allow(""), bankAccountNumber: Joi.string().pattern(/^[0-9 ]*$/).max(40).allow("") }).validate(req.body);
  if(validation.error) return res.status(400).json({ code: "error", message: "Thông tin website hoặc tài khoản ngân hàng không hợp lệ." });
  if(req.body.categoryIdSection4 && !await Category.exists({ _id: req.body.categoryIdSection4, status: "active", deleted: false })) {
    return res.json({ code: "error", message: "Danh mục trang chủ không hợp lệ." });
  }
  if(req.files && req.files.logo) {
    req.body.logo = req.files.logo[0].path;
  } else if(clearLogo) req.body.logo = "";

  if(req.files && req.files.favicon) {
    req.body.favicon = req.files.favicon[0].path;
  } else if(clearFavicon) req.body.favicon = "";

  const countRecord = await SettingWebsiteInfo.countDocuments({});
  if(countRecord > 0) {
    await SettingWebsiteInfo.updateOne({}, req.body);
  } else {
    const newRecord = new SettingWebsiteInfo(req.body);
    await newRecord.save();
  }

  res.json({
    code: "success",
    message: "Cập nhật thành công!"
  })
}

module.exports.accountAdminList = async (req, res) => {
  const find = { deleted: false };
  if(["initial", "active", "inactive"].includes(req.query.status)) find.status = req.query.status;
  if(req.query.keyword) find.$or = ["fullName", "email"].map(field => ({ [field]: new RegExp(escapeRegex(String(req.query.keyword).slice(0, 100)), "i") }));
  const pageInfo = await pagination(AccountAdmin, find, req.query);
  const accountAdminList = await AccountAdmin.find(find).sort({ createdAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit);

  const roles = new Map((await Role.find({ deleted: false }).select("name")).map(item => [item.id, item.name]));
  for (const item of accountAdminList) item.roleName = roles.get(item.role) || "Chưa gán nhóm quyền";

  res.render("admin/pages/setting-account-admin-list", {
    pageTitle: "Tài khoản quản trị",
    pagination: pageInfo, listCount: accountAdminList.length,
    accountAdminList: accountAdminList
  });
}

module.exports.accountAdminCreate = async (req, res) => {
  const roleList = await Role
    .find({
      deleted: false
    })
    .sort({
      createdAt: "desc"
    })

  res.render("admin/pages/setting-account-admin-create", {
    pageTitle: "Tạo tài khoản quản trị",
    roleList: roleList
  });
}

module.exports.accountAdminCreatePost = async (req, res) => {
  try {
    req.body = pick(req.body, ["fullName", "email", "phone", "role", "positionCompany", "status", "password"]);
    await validateAccount(req.body, true);
    const existAccount = await AccountAdmin.findOne({
      email: req.body.email
    })

    if(existAccount) {
      res.json({
        code: "error",
        message: "Email đã tồn tại trong hệ thống!"
      })
      return;
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    req.body.createdBy = req.account.id;
    req.body.updatedBy = req.account.id;
    if(req.file) req.body.avatar = req.file.path;

    const newRecord = new AccountAdmin(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo tài khoản thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

module.exports.accountAdminEdit = async (req, res) => {
  try {
    const id = req.params.id;

    const accountDetail = await AccountAdmin.findOne({
      _id: id,
      deleted: false
    })

    if(!accountDetail) {
      res.redirect(`/${pathAdmin}/setting/account-admin/list`);
      return;
    }

    const roleList = await Role
      .find({
        deleted: false
      })
      .sort({
        createdAt: "desc"
      })

    res.render("admin/pages/setting-account-admin-edit", {
      pageTitle: "Chỉnh sửa tài khoản quản trị",
      roleList: roleList,
      accountDetail: accountDetail
    });
  } catch (error) {
    res.redirect(`/${pathAdmin}/setting/account-admin/list`);
  }
}

module.exports.accountAdminEditPatch = async (req, res) => {
  try {
    const clearAvatar = req.body.clearAvatar === "true";
    req.body = pick(req.body, ["fullName", "email", "phone", "role", "positionCompany", "status", "password"]);
    await validateAccount(req.body, false);
    if(req.params.id === req.account.id) {
      const ownRole = req.body.role ? await Role.findById(req.body.role) : null;
      if(req.body.status !== "active" || !ownRole?.permissions.includes("setting-manage")) return res.status(400).json({ code: "error", message: "Không thể tự khóa tài khoản hoặc gỡ quyền quản lý cài đặt." });
    }
    const id = req.params.id;

    const accountDetail = await AccountAdmin.findOne({
      _id: id,
      deleted: false
    })

    if(!accountDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!"
      })
      return;
    }

    const existEmail = await AccountAdmin.findOne({
      _id: { $ne: id }, // ne: not equal
      email: req.body.email
    })

    if(existEmail) {
      res.json({
        code: "error",
        message: "Email đã tồn tại trong hệ thống!"
      })
      return;
    }

    if(req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    } else {
      delete req.body.password;
    }

    req.body.updatedBy = req.account.id;
    if(req.file) req.body.avatar = req.file.path;
    else if(clearAvatar) req.body.avatar = "";

    await AccountAdmin.updateOne({ _id: id }, { $set: req.body, $inc: { tokenVersion: 1 } }, { runValidators: true });

    res.json({
      code: "success",
      message: "Cập nhật tài khoản thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

module.exports.roleList = async (req, res) => {
  const find = { deleted: false };
  if(req.query.keyword) find.$or = ["name"].map(field => ({ [field]: new RegExp(escapeRegex(String(req.query.keyword).slice(0, 100)), "i") }));
  const pageInfo = await pagination(Role, find, req.query);
  const roleList = await Role.find(find).sort({ createdAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit);

  res.render("admin/pages/setting-role-list", {
    pageTitle: "Nhóm quyền",
    pagination: pageInfo, listCount: roleList.length,
    roleList: roleList
  });
}

module.exports.roleCreate = async (req, res) => {
  res.render("admin/pages/setting-role-create", {
    pageTitle: "Tạo nhóm quyền",
    permissionList: permissionList
  });
}

module.exports.roleCreatePost = async (req, res) => {
  try {
    req.body = pick(req.body, ["name", "description", "permissions"]);
    if(!req.body.name || !Array.isArray(req.body.permissions) || req.body.permissions.some(value => !permissionList.some(item => item.value === value))) {
      return res.json({ code: "error", message: "Tên hoặc danh sách quyền không hợp lệ." });
    }
    req.body.createdBy = req.account.id;
    req.body.updatedBy = req.account.id;

    const newRecord = new Role(req.body);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo nhóm quyền thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}

module.exports.roleEdit = async (req, res) => {
  try {
    const id = req.params.id;

    const roleDetail = await Role.findOne({
      _id: id,
      deleted: false
    })

    if(!roleDetail) {
      res.redirect(`/${pathAdmin}/setting/role/list`);
      return;
    }

    res.render("admin/pages/setting-role-edit", {
      pageTitle: "Chỉnh sửa nhóm quyền",
      permissionList: permissionList,
      roleDetail: roleDetail
    });
  } catch (error) {
    res.redirect(`/${pathAdmin}/setting/role/list`);
  }
}

module.exports.roleEditPatch = async (req, res) => {
  try {
    req.body = pick(req.body, ["name", "description", "permissions"]);
    if(!req.body.name || !Array.isArray(req.body.permissions) || req.body.permissions.some(value => !permissionList.some(item => item.value === value))) {
      return res.json({ code: "error", message: "Tên hoặc danh sách quyền không hợp lệ." });
    }
    const id = req.params.id;

    const roleDetail = await Role.findOne({
      _id: id,
      deleted: false
    })

    if(!roleDetail) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!"
      })
      return;
    }

    if(req.account.role === id && !req.body.permissions.includes("setting-manage")) return res.status(400).json({ code: "error", message: "Không thể tự gỡ quyền quản lý cài đặt của nhóm đang sử dụng." });
    req.body.updatedBy = req.account.id;

    await Role.updateOne({
      _id: id,
      deleted: false
    }, req.body);

    res.json({
      code: "success",
      message: "Cập nhật nhóm quyền thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}
async function validateAccount(data, creating) {
  const schema = Joi.object({
    fullName: Joi.string().trim().min(2).max(80).required(), email: Joi.string().email().required(),
    phone: Joi.string().allow(""), role: Joi.string().allow(""), positionCompany: Joi.string().allow(""),
    status: Joi.string().valid("initial", "active", "inactive").required(),
    password: creating ? Joi.string().min(8).max(128).required() : Joi.string().min(8).max(128).allow("")
  });
  const { error } = schema.validate(data);
  if(error) throw error;
  if(data.role && !await Role.exists({ _id: data.role, deleted: false })) throw new Error("Nhóm quyền không tồn tại");
}

module.exports.accountAdminDeletePatch = async (req, res) => {
  if(req.params.id === req.account.id) return res.status(400).json({ code: "error", message: "Không thể tự xóa tài khoản đang đăng nhập." });
  const result = await AccountAdmin.updateOne({ _id: req.params.id, deleted: false }, { $set: { deleted: true, status: "inactive", deletedBy: req.account.id, deletedAt: new Date() }, $inc: { tokenVersion: 1 } });
  if(!result.matchedCount) return res.status(404).json({ code: "error", message: "Tài khoản không tồn tại hoặc đã xóa." });
  res.json({ code: "success", message: "Đã xóa tài khoản quản trị." });
};
module.exports.roleDeletePatch = async (req, res) => {
  if(await AccountAdmin.exists({ role: req.params.id, deleted: false })) return res.status(400).json({ code: "error", message: "Nhóm quyền đang được sử dụng. Hãy chuyển tài khoản sang nhóm khác trước." });
  const result = await Role.updateOne({ _id: req.params.id, deleted: false }, { deleted: true, deletedBy: req.account.id, deletedAt: new Date() });
  if(!result.matchedCount) return res.status(404).json({ code: "error", message: "Nhóm quyền không tồn tại hoặc đã xóa." });
  res.json({ code: "success", message: "Đã xóa nhóm quyền." });
};
