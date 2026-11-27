const categoryHelper = require("./category.helper");
const moment = require("moment");
module.exports.visibleFilter = async () => {
  const categoryIds = await categoryHelper.visibleIds();

  return {
    deleted: false,
    status: "active",
    category: {
      $in: [...categoryIds, "", null]
    }
  };
};

module.exports.bookableFilter = async () => {
  const find = await module.exports.visibleFilter();

  find.category = {
    $in: await categoryHelper.visibleIds()
  };
  find.departureDate = {
    $gte: moment()
      .startOf("day")
      .toDate()
  };
  find.$or = [{
      stockAdult: {
        $gt: 0
      }
    },
    {
      stockChildren: {
        $gt: 0
      }
    },
    {
      stockBaby: {
        $gt: 0
      }
    }
  ];

  return find;
};

module.exports.decorate = (tours) => {
  for(const item of tours) {
    item.discount = item.priceAdult > 0 ? Math.max(0, Math.floor((item.priceAdult - item
      .priceNewAdult) / item.priceAdult * 100)) : 0;
    item.departureDateFormat = item.departureDate ? moment(item.departureDate)
      .format("DD/MM/YYYY") : "Đang cập nhật";
  }
  return tours;
};
