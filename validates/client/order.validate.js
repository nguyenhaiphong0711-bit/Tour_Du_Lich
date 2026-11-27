const Joi = require("joi");
const objectId = Joi.string().hex().length(24);
const quantity = Joi.number().integer().min(0).max(1000).required();
module.exports.schema = Joi.object({
  fullName: Joi.string().trim().min(2).max(80).required(), phone: Joi.string().pattern(/^0[0-9]{9}$/).required(),
  note: Joi.string().max(2000).allow("").default(""), paymentMethod: Joi.string().valid("money", "bank", "vnpay", "zalopay").required(),
  couponCode: Joi.string().max(40).pattern(/^[A-Za-z0-9_-]*$/).allow(""),
  items: Joi.array().min(1).max(20).items(Joi.object({
    tourId: objectId.required(), locationFrom: objectId.required(), quantityAdult: quantity, quantityChildren: quantity, quantityBaby: quantity,
    checked: Joi.boolean()
  }).custom((item, helpers) => item.quantityAdult + item.quantityChildren + item.quantityBaby > 0 ? item : helpers.error("any.invalid"))).required()
});
