const Joi = require("joi");
const categoryHelper = require("../../helpers/category.helper");
const { cleanHtml } = require("../../helpers/data.helper");

module.exports.createPost = async (req, res, next) => {
  try {
    const { error } = Joi.object({ name: Joi.string().trim().min(2).max(150).required(), parent: Joi.string().hex().length(24).allow(""),
      position: Joi.number().integer().min(0).empty(""), status: Joi.string().valid("active", "inactive").required(),
      avatar: Joi.string().allow(""), description: Joi.string().max(50000).allow("") }).validate(req.body);
    if(error) throw new Error("Tên, trạng thái hoặc vị trí danh mục không hợp lệ.");
    await categoryHelper.validateParent(req.params.id, req.body.parent);
    req.body.description = cleanHtml(req.body.description);
    next();
  } catch (error) {
    res.status(400).json({ code: "error", message: error.message });
  }
};
