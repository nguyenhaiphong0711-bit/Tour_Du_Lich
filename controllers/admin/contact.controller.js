const Contact = require("../../models/contact.model");
const moment = require("moment");
const { pagination, escapeRegex } = require("../../helpers/data.helper");
module.exports.list = async (req, res) => {
  const find = { deleted: false };
  if(req.query.keyword) find.email = new RegExp(escapeRegex(String(req.query.keyword).slice(0, 100)), "i");
  const pageInfo = await pagination(Contact, find, req.query);
  const contactList = await Contact.find(find).sort({ createdAt: -1 }).skip(pageInfo.skip).limit(pageInfo.limit);
  for (const item of contactList) item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
  res.render("admin/pages/contact-list", { pageTitle: "Thông tin liên hệ", contactList, pagination: pageInfo, listCount: contactList.length });
};
module.exports.deletePatch = async (req, res) => {
  const result = await Contact.updateOne({ _id: req.params.id, deleted: false }, { deleted: true, deletedBy: req.account.id, deletedAt: new Date() });
  if(!result.matchedCount) return res.status(404).json({ code: "error", message: "Đăng ký nhận tin không tồn tại hoặc đã xóa." });
  res.json({ code: "success", message: "Đã xóa đăng ký nhận tin." });
};
