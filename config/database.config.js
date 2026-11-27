const mongoose = require("mongoose");

module.exports.connect = async () => {
  if(!process.env.DATABASE) {
    throw new Error("Chưa cấu hình DATABASE.");
  }
  await mongoose.connect(process.env.DATABASE);
  console.log("Kết nối CSDL thành công!");
};
