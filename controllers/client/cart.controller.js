const tourHelper = require("../../helpers/tour.helper");
const Tour = require("../../models/tour.model");
const City = require("../../models/city.model");
const moment = require("moment");

module.exports.cart = async (req, res) => {
  res.render("client/pages/cart", {
    pageTitle: "Giỏ hàng"
  });
}

module.exports.detailPost = async (req, res) => {
  try {
    const cart = req.body;
    if(!Array.isArray(cart) || cart.length > 100) {
      throw new Error();
    }
    const cartDetail = [];

    for(const item of cart) {
      const tourInfo = await Tour
        .findOne({
          ...await tourHelper.bookableFilter(),
          _id: item.tourId
        })
      if(tourInfo && tourInfo.locations.includes(item.locationFrom)) {
        const cityInfo = await City.findOne({
          _id: item.locationFrom
        });

        if(!cityInfo) {
          continue;
        }
        const quantity = (value) => Number.isSafeInteger(value) && value >= 0 ? value : 0;
        const itemDetail = {
          tourId: tourInfo.id,
          locationFrom: cityInfo.id,
          checked: item.checked === true,
          quantityAdult: Math.min(quantity(item.quantityAdult), tourInfo.stockAdult),
          quantityChildren: Math.min(quantity(item.quantityChildren), tourInfo.stockChildren),
          quantityBaby: Math.min(quantity(item.quantityBaby), tourInfo.stockBaby),
          avatar: tourInfo.avatar,
          name: tourInfo.name,
          slug: tourInfo.slug,
          departureDate: moment(tourInfo.departureDate)
            .format("DD/MM/YYYY"),
          cityName: cityInfo.name,
          priceNewAdult: tourInfo.priceNewAdult,
          priceNewChildren: tourInfo.priceNewChildren,
          priceNewBaby: tourInfo.priceNewBaby,
          stockAdult: tourInfo.stockAdult,
          stockChildren: tourInfo.stockChildren,
          stockBaby: tourInfo.stockBaby,
        };
        cartDetail.push(itemDetail);
      }
    }

    res.json({
      code: "success",
      message: "Thành công!",
      cart: cartDetail
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!"
    })
  }
}
module.exports.couponPost = async (req, res) => {
  try {
    const schema = require("../../validates/client/order.validate")
      .schema;
    const {
      error,
      value
    } = schema.validate({
      ...req.body,
      fullName: "Khách hàng",
      phone: "0900000000",
      paymentMethod: "money"
    }, {
      convert: false
    });
    if(error || !value.couponCode) {
      throw new Error("Mã giảm giá hoặc giỏ hàng không hợp lệ.");
    }
    let total = 0;
    for(const item of value.items) {
      const tour = await Tour.findOne({
        ...await tourHelper.bookableFilter(),
        _id: item.tourId,
        locations: item.locationFrom
      });
      if(!tour) {
        throw new Error("Tour không còn mở bán.");
      }
      total += item.quantityAdult * tour.priceNewAdult + item.quantityChildren * tour
        .priceNewChildren + item.quantityBaby * tour.priceNewBaby;
    }
    const discount = await require("../../helpers/coupon.helper")
      .discount(value.couponCode, total);
    res.json({
      code: "success",
      discount
    });
  } catch (error) {
    res.status(400)
      .json({
        code: "error",
        message: error.message
      });
  }
};
