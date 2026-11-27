const jwt = require("jsonwebtoken");
const AccountAdmin = require("../../models/account-admin.model");
const Role = require("../../models/role.model");

module.exports.verifyToken = async (req, res, next) => {
  try {
    const decoded = jwt.verify(req.cookies.token || "", process.env.JWT_SECRET);
    if(decoded.purpose && decoded.purpose !== "login") {
      throw new Error("Token không hợp lệ");
    }
    const account = await AccountAdmin.findOne({
      _id: decoded.id,
      email: decoded.email,
      status: "active",
      deleted: false
    });
    if(!account || (decoded.tokenVersion || 0) !== (account.tokenVersion || 0)) {
      throw new Error("Phiên đăng nhập hết hạn");
    }
    req.permissions = [];
    if(require("mongoose")
      .isValidObjectId(account.role)) {
      const role = await Role.findOne({
        _id: account.role,
        deleted: false
      });
      if(role) {
        account.roleName = role.name;
        req.permissions = role.permissions || [];
      }
    }
    const sections = req.originalUrl.split("?")[0].split("/")
      .filter(Boolean)
      .slice(1);
    res.locals.adminSection = sections[0] === "setting" && ["account-admin", "role", "branding"].includes(
      sections[1]) ? `setting/${sections[1]}` : sections[0];
    res.locals.permissions = req.permissions;
    req.account = account;
    res.locals.account = account;
    next();
  } catch (error) {
    res.clearCookie("token");
    if(req.method !== "GET") {
      return res.status(401)
        .json({
          code: "error",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        });
    }
    res.redirect(`/${pathAdmin}/account/login`);
  }
};

module.exports.checkPermission = (permission) => (req, res, next) => {
  if(req.permissions.includes(permission)) {
    return next();
  }
  if(req.method !== "GET") {
    return res.status(403)
      .json({
        code: "error",
        message: "Bạn không có quyền thực hiện thao tác này."
      });
  }
  res.status(403)
    .render("admin/pages/access-denied", {
      pageTitle: "Không có quyền truy cập"
    });
};

module.exports.verifyResetToken = async (req, res, next) => {
  try {
    const decoded = jwt.verify(req.cookies.resetToken || "", process.env.JWT_SECRET);
    if(decoded.purpose !== "reset") {
      throw new Error();
    }
    const account = await AccountAdmin.findOne({
      _id: decoded.id,
      deleted: false,
      status: "active"
    });
    if(!account || decoded.tokenVersion !== (account.tokenVersion || 0)) {
      throw new Error();
    }
    req.account = account;
    next();
  } catch (error) {
    res.clearCookie("resetToken");
    res.status(401)
      .json({
        code: "error",
        message: "Yêu cầu đổi mật khẩu hết hạn. Vui lòng xác thực OTP lại."
      });
  }
};
