require("dotenv")
  .config();
const mongoose = require("mongoose");
const AccountAdmin = require("../models/account-admin.model");
const Role = require("../models/role.model");
const {
  permissionList
} = require("../config/variable.config");

(async () => {
  const email = process.argv[2];
  if(!email) {
    throw new Error("Cách dùng: npm run permissions -- email-quan-tri");
  }
  await mongoose.connect(process.env.DATABASE);
  const account = await AccountAdmin.findOne({
    email: email.toLowerCase(),
    deleted: false,
    status: "active"
  });
  if(!account) {
    throw new Error("Không tìm thấy tài khoản đang hoạt động.");
  }
  const role = await Role.create({
    name: `Quản trị ${email}`,
    permissions: permissionList.map(item => item.value)
  });
  account.role = role.id;
  await account.save();
  console.log("Đã gán đầy đủ quyền cho tài khoản được chỉ định.");
})()
.catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
