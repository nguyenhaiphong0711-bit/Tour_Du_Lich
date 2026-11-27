const {
  cleanHtml
} = require("../../helpers/data.helper");
const tourHelper = require("../../helpers/tour.helper");
const Tour = require("../../models/tour.model");
const City = require("../../models/city.model");
const categoryHelper = require("../../helpers/category.helper");
const moment = require("moment");

module.exports.detail = async (req, res) => {
  const slug = req.params.slug;

  // Thông tin chi tiết tour
  const tourDetail = await Tour
    .findOne({
      ...await tourHelper.visibleFilter(),
      slug: slug
    })

  if(!tourDetail) {
    res.redirect("/");
    return;
  }
  tourDetail.information = cleanHtml(tourDetail.information);
  for(const item of tourDetail.schedules) {
    item.description = cleanHtml(item.description);
  }
  // Hết Thông tin chi tiết tour

  // Breadcrumb
  const breadcrumb = [];

  if(tourDetail.category) {
    const categoryList = await categoryHelper.getCategoryParent(tourDetail.category);
    for(const item of categoryList) {
      breadcrumb.push(item);
    }
  }

  breadcrumb.push({
    id: tourDetail.id,
    name: tourDetail.name,
    avatar: tourDetail.avatar,
    slug: tourDetail.slug,
  });
  // Hết Breadcrumb

  tourDetail.departureDateFormat = "Đang cập nhật";
  tourDetail.cityList = [];
  tourDetail.canBook = await Tour.exists({
    ...await tourHelper.bookableFilter(),
    _id: tourDetail.id
  });

  if(tourDetail.departureDate) {
    tourDetail.departureDateFormat = moment(tourDetail.departureDate)
      .format("DD/MM/YYYY");
  }

  if(tourDetail.locations && tourDetail.locations.length > 0) {
    const cityList = await City
      .find({
        _id: {
          $in: tourDetail.locations.filter(id => /^[a-f0-9]{24}$/i.test(id))
        }
      })
      .sort({
        name: "asc"
      })

    tourDetail.cityList = cityList;
  }

  res.render("client/pages/tour-detail", {
    pageTitle: tourDetail.name,
    breadcrumb: breadcrumb,
    tourDetail: tourDetail
  });
}
