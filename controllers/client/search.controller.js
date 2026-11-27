const tourHelper = require("../../helpers/tour.helper");
const Tour = require("../../models/tour.model");
const moment = require("moment");
const slugify = require('slugify');

module.exports.list = async (req, res) => {
  try {
    const find = await tourHelper.visibleFilter();

    // Điểm đi
    if(req.query.locationFrom) {
      find.locations = req.query.locationFrom;
    }
    // Hết Điểm đi

    // Điểm đến
    if(req.query.locationTo) {
      const keyword = slugify(req.query.locationTo);
      const keywordRegex = new RegExp(require("../../helpers/data.helper")
        .escapeRegex(keyword), "i");
      find.slug = keywordRegex;
    }
    // Hết Điểm đến

    // Ngày khởi hành
    if(req.query.departureDate) {
      const date = moment(req.query.departureDate, "YYYY-MM-DD", true);
      if(!date.isValid() || date.isBefore(moment()
          .startOf("day"))) {
        return res.redirect("/");
      }
      find.departureDate = {
        $gte: date.startOf("day")
          .toDate(),
        $lte: date.clone()
          .endOf("day")
          .toDate()
      };
    }
    // Hết Ngày khởi hành

    // Số lượng hành khách
    // Người lớn
    if(req.query.stockAdult) {
      find.stockAdult = {
        $gte: parseInt(req.query.stockAdult)
      };
    }

    // Trẻ em
    if(req.query.stockChildren) {
      find.stockChildren = {
        $gte: parseInt(req.query.stockChildren)
      };
    }

    // Em bé
    if(req.query.stockBaby) {
      find.stockBaby = {
        $gte: parseInt(req.query.stockBaby)
      };
    }
    // Hết Số lượng hành khách

    // Khoảng giá
    if(req.query.price) {
      const [priceMin, priceMax] = req.query.price.split("-")
        .map(item => parseInt(item));
      find.priceNewAdult = {
        $gte: priceMin,
        $lte: priceMax
      };
    }
    // Hết Khoảng giá

    const tourList = await Tour
      .find(find)
      .sort({
        position: "desc"
      })

    for(const item of tourList) {
      item.discount = item.priceAdult > 0 ? Math.max(0, Math.floor(((item.priceAdult - item
        .priceNewAdult) / item.priceAdult) * 100)) : 0;

      if(item.departureDate) {
        item.departureDateFormat = moment(item.departureDate)
          .format("DD/MM/YYYY");
      }
    }

    res.render("client/pages/search", {
      pageTitle: "Kết quả tìm kiếm",
      tourList: tourList
    });
  } catch (error) {
    res.redirect("/");
  }
}
