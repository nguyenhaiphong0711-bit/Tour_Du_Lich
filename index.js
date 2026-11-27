require("dotenv").config();
process.env.TZ = process.env.TZ || "Asia/Ho_Chi_Minh";
const databaseConfig = require("./config/database.config");
const mongoose = require("mongoose");

const start = async () => {
  if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET cần ít nhất 32 ký tự ngẫu nhiên.");
  await databaseConfig.connect();
  const app = require("./app");
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const bookingHelper = require("./helpers/booking.helper");
  await bookingHelper.releaseExpired();
  const server = app.listen(process.env.PORT || 5000, () => console.log(`Website đang chạy ở cổng ${process.env.PORT || 5000}`));
  let running = false;
  const timer = setInterval(async () => {
    if(running) return;
    running = true;
    try { await bookingHelper.releaseExpired(); } catch (error) { console.error("Chưa giải phóng được đơn hết hạn:", error.message); }
    finally { running = false; }
  }, 60000);
  timer.unref();
  const stop = () => { clearInterval(timer); server.close(() => mongoose.disconnect().then(() => process.exit(0))); };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
};
if(require.main === module) start().catch(error => { console.error("Không thể khởi động:", error.message); process.exitCode = 1; mongoose.disconnect(); });
module.exports = { start };
