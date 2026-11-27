const SettingWebsiteInfo = require("../../models/setting-website-info.model");

module.exports.websiteInfo = async (req, res, next) => {
  const record = await SettingWebsiteInfo.findOne({});
  const settingWebsiteInfo = {
    websiteName: "Travel Studio",
    phone: "",
    email: "",
    address: "",
    logo: "",
    favicon: "",
    categoryIdSection4: "",
    ...(record?.toObject() || {})
  };

  res.locals.paymentAvailable = {
    vnpay: Boolean(process.env.VNPAY_TMNCODE && process.env.VNPAY_SECRET && process.env
      .VNPAY_URL),
    zalopay: Boolean(process.env.ZALOPAY_APPID && process.env.ZALOPAY_KEY1 && process.env
      .ZALOPAY_KEY2 && process.env.ZALOPAY_DOMAIN)
  };
  res.locals.settingWebsiteInfo = settingWebsiteInfo;
  req.settingWebsiteInfo = settingWebsiteInfo;

  next();
}
