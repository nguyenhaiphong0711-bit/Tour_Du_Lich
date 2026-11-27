const sanitizeHtml = require("sanitize-html");

module.exports.pick = (body, fields) => {
  const data = {};
  for(const field of fields) {
    if(Object.hasOwn(body, field)) {
      data[field] = body[field];
    }
  }
  return data;
};

module.exports.cleanHtml = (html = "") => sanitizeHtml(html, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
  allowedAttributes: {
    a: ["href", "title", "target"],
    img: ["src", "alt", "width", "height"]
  },
  allowedSchemes: ["http", "https", "mailto", "tel"]
});

module.exports.escapeRegex = (value = "") => String(value)
  .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports.pagination = async (Model, find, query, limit = 12) => {
  const totalRecord = await Model.countDocuments(find);
  const totalPage = Math.max(1, Math.ceil(totalRecord / limit));
  const page = Math.min(totalPage, Math.max(1, parseInt(query.page) || 1));
  return {
    totalRecord,
    totalPage,
    page,
    limit,
    skip: (page - 1) * limit
  };
};
