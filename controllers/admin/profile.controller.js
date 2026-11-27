const AccountAdmin = require("../../models/account-admin.model");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const { pick } = require("../../helpers/data.helper");

module.exports.edit = async (req, res) => {
  res.render("admin/pages/profile-edit", {
    pageTitle: "Thông tin cá nhân"
  });
}

module.exports.editPatch = async (req, res) => {
  try {
    const id = req.account.id;

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

    const { error } = Joi.object({ fullName: Joi.string().trim().min(2).max(80).required(), email: Joi.string().email().required(), phone: Joi.string().pattern(/^0[0-9]{9}$/).required() }).validate(pick(req.body, ["fullName", "email", "phone"]));
    if(error) return res.json({ code: "error", message: "Thông tin cá nhân không hợp lệ." });
    const clearAvatar = req.body.clearAvatar === "true";
    req.body = pick(req.body, ["fullName", "email", "phone"]);
    req.body.updatedBy = id;
    if(req.file) req.body.avatar = req.file.path;
    else if(clearAvatar) req.body.avatar = "";

    await AccountAdmin.updateOne({
      _id: id
    }, req.body)

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

module.exports.changePassword = async (req, res) => {
  res.render("admin/pages/profile-change-password", {
    pageTitle: "Đổi mật khẩu"
  });
}

module.exports.changePasswordPatch = async (req, res) => {
  try {
    const id = req.account.id;

    const { error } = Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/).required().validate(req.body.password);
    if(error) return res.json({ code: "error", message: "Mật khẩu cần ít nhất 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt." });
    const password = await bcrypt.hash(req.body.password, 10);
    await AccountAdmin.updateOne({ _id: id }, { $set: { password, updatedBy: id }, $inc: { tokenVersion: 1 } });
    res.clearCookie("token");

    res.json({
      code: "success",
      message: "Đổi mật khẩu thành công!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}
