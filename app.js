const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const variableConfig = require("./config/variable.config");
const app = express();
app.disable("x-powered-by");
if(process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
}
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.locals.pathAdmin = variableConfig.pathAdmin;
global.pathAdmin = variableConfig.pathAdmin;
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({
  limit: "256kb"
}));
app.use(cookieParser());
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  if(req.path.startsWith("/admin") || req.path.startsWith("/order")) {
    res.set("Cache-Control", "no-store");
  }
  if(!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.path.startsWith("/admin")) {
    const origin = req.get("origin");
    const allowedOrigins = new Set([new URL(`${req.protocol}://${req.get("host")}`)
      .origin
    ]);
    if(process.env.WEBSITE_DOMAIN) {
      try {
        allowedOrigins.add(new URL(process.env.WEBSITE_DOMAIN)
          .origin);
      } catch (error) {
        /* Địa chỉ hiện tại vẫn được kiểm tra độc lập. */
      }
    }
    if(origin && !allowedOrigins.has(origin)) {
      return res.status(403)
        .json({
          code: "error",
          message: "Nguồn yêu cầu không hợp lệ. Vui lòng mở trang đăng nhập từ đúng địa chỉ website."
        });
    }
  }
  next();
});
app.get("/health", (req, res) => res.json({
  status: "ok"
}));
app.use(`/${variableConfig.pathAdmin}`, require("./routes/admin/index.route"));
app.use("/", require("./routes/client/index.route"));
app.use((req, res) => res.status(404)
  .send("Không tìm thấy trang."));
app.use((error, req, res, next) => {
  if(res.headersSent) {
    return next(error);
  }
  const message = error.code === 11000 ?
    "Dữ liệu đã tồn tại. Vui lòng kiểm tra email hoặc mã." :
    error.code === "LIMIT_FILE_SIZE" ? "Ảnh không được vượt quá 5 MB." :
    error.name === "MulterError" ? "Tệp tải lên không hợp lệ." :
    "Không thể xử lý yêu cầu. Vui lòng kiểm tra dữ liệu hoặc thử lại sau.";
  console.error(error.name, error.code || "", error.message);
  if(req.method !== "GET" || req.path.includes("-ipn")) {
    return res.status(400)
      .json({
        code: "error",
        message
      });
  }
  res.status(500)
    .send(message);
});
module.exports = app;
