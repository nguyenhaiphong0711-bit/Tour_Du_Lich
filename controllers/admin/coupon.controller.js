const Joi = require("joi");
const Coupon = require("../../models/coupon.model");
const {
  pick
} = require("../../helpers/data.helper");
module.exports.list = async (req, res) => {
  res.render("admin/pages/coupon-list", {
    pageTitle: "Mã giảm giá",
    couponList: await Coupon.find({})
      .sort({
        createdAt: -1
      })
      .limit(100)
  });
};
module.exports.savePost = async (req, res) => {
  const {
    error,
    value
  } = Joi.object({
      code: Joi.string()
        .uppercase()
        .pattern(/^[A-Z0-9_-]{3,40}$/)
        .required(),
      percent: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required(),
      minTotal: Joi.number()
        .integer()
        .min(0)
        .required(),
      maxDiscount: Joi.number()
        .integer()
        .min(0)
        .required(),
      expiresAt: Joi.date()
        .greater("now")
        .required(),
      status: Joi.string()
        .valid("active", "inactive")
        .required()
    })
    .validate(req.body);
  if(error) {
    return res.status(400)
      .json({
        code: "error",
        message: "Kiểm tra mã, phần trăm, số tiền và ngày hết hạn."
      });
  }
  await Coupon.findOneAndUpdate({
    code: value.code
  }, {
    $set: {
      ...value,
      updatedBy: req.account.id
    }
  }, {
    upsert: true,
    runValidators: true
  });
  res.json({
    code: "success",
    message: "Đã lưu mã giảm giá."
  });
};
module.exports.statusPatch = async (req, res) => {
  if(!["active", "inactive"].includes(req.body.status)) {
    return res.status(400)
      .json({
        code: "error",
        message: "Trạng thái không hợp lệ."
      });
  }
  await Coupon.updateOne({
    _id: req.params.id
  }, {
    $set: pick(req.body, ["status"])
  });
  res.json({
    code: "success",
    message: "Đã cập nhật."
  });
};
