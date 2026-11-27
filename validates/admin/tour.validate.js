const Joi = require("joi");
const Category = require("../../models/category.model");
const City = require("../../models/city.model");
const {
  cleanHtml
} = require("../../helpers/data.helper");

module.exports.createPost = async (req, res, next) => {
  try {
    const number = Joi.number()
      .integer()
      .min(0)
      .max(1000000000)
      .empty("")
      .default(0);
    const schema = Joi.object({
      updatedAt: Joi.date()
        .iso(),
      clearAvatar: Joi.string()
        .valid("true", "false"),
      name: Joi.string()
        .trim()
        .min(2)
        .max(200)
        .required(),
      category: Joi.string()
        .hex()
        .length(24)
        .required(),
      position: Joi.number()
        .integer()
        .min(0)
        .empty(""),
      status: Joi.string()
        .valid("active", "inactive")
        .required(),
      imageOrder: Joi.string()
        .max(20000),
      avatar: Joi.string()
        .allow(""),
      images: Joi.string()
        .allow(""),
      clearImages: Joi.string()
        .valid("true", "false"),
      priceAdult: number,
      priceChildren: number,
      priceBaby: number,
      priceNewAdult: number,
      priceNewChildren: number,
      priceNewBaby: number,
      stockAdult: number,
      stockChildren: number,
      stockBaby: number,
      locations: Joi.string()
        .required(),
      departureDate: Joi.date()
        .required(),
      time: Joi.string()
        .max(100)
        .allow(""),
      vehicle: Joi.string()
        .max(100)
        .allow(""),
      information: Joi.string()
        .max(100000)
        .allow(""),
      schedules: Joi.string()
        .required()
    });
    const {
      error,
      value
    } = schema.validate(req.body);
    if(error) {
      throw new Error(
        "Kiểm tra tên tour, danh mục, ngày khởi hành, giá và số chỗ (số nguyên không âm).");
    }
    for(const field of ["position", "priceAdult", "priceChildren", "priceBaby", "stockAdult",
        "stockChildren", "stockBaby"
      ]) {
      if(req.body[field] !== "" && value[field] !== undefined) {
        req.body[field] = String(value[field]);
      }
    }
    for(const type of ["Adult", "Children", "Baby"]) {
      const oldPrice = Number(req.body[`price${type}`] || 0);
      const input = req.body[`priceNew${type}`];
      const newPrice = input === "" || input === undefined ? oldPrice : Number(input);
      if(newPrice > oldPrice) {
        throw new Error("Giá ưu đãi không được lớn hơn giá gốc.");
      }
      req.body[`priceNew${type}`] = String(newPrice);
    }
    if(req.body.status === "active" && Number(req.body.priceNewAdult) <= 0) {
      throw new Error("Tour đang bán phải có giá người lớn lớn hơn 0.");
    }
    if(!await Category.exists({
        _id: req.body.category,
        deleted: false
      })) {
      throw new Error("Danh mục không tồn tại hoặc đã xóa.");
    }
    const locations = JSON.parse(req.body.locations);
    if(!Array.isArray(locations) || !locations.length || locations.length > 100 || locations
      .some(id => !/^[a-f0-9]{24}$/i.test(id))) {
      throw new Error("Chọn ít nhất một điểm khởi hành hợp lệ.");
    }
    if(await City.countDocuments({
        _id: {
          $in: locations
        }
      }) !== new Set(locations)
      .size) {
      throw new Error("Điểm khởi hành không tồn tại.");
    }
    if(req.body.imageOrder !== undefined) {
      const imageOrder = JSON.parse(req.body.imageOrder);
      if(!Array.isArray(imageOrder) || imageOrder.length > 10 || imageOrder.some(item =>
          typeof item !== "string" && !Number.isInteger(item))) {
        throw new Error("Chỉ được chọn tối đa 10 ảnh hợp lệ.");
      }
    }
    const schedules = JSON.parse(req.body.schedules);
    if(!Array.isArray(schedules) || schedules.length > 100) {
      throw new Error("Lịch trình không hợp lệ.");
    }
    req.body.schedules = JSON.stringify(schedules.map(item => {
      if(typeof item.title !== "string" || typeof item.description !== "string") {
        throw new Error("Lịch trình không hợp lệ.");
      }
      return {
        title: item.title.slice(0, 200),
        description: cleanHtml(item.description)
      };
    }));
    req.body.information = cleanHtml(req.body.information);
    next();
  } catch (error) {
    res.status(400)
      .json({
        code: "error",
        message: error.message
      });
  }
};
