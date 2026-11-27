const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  websiteName: String,
  bankName: String,
  bankAccountName: String,
  bankAccountNumber: String,
  phone: String,
  email: String,
  address: String,
  logo: String,
  favicon: String,
  categoryIdSection4: String,
});

const SettingWebsiteInfo = mongoose.model('SettingWebsiteInfo', schema, "setting-website-info");

module.exports = SettingWebsiteInfo;
