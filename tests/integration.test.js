const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
process.env.JWT_SECRET = "local-test-secret-with-more-than-32-characters";
process.env.VNPAY_SECRET = "local-vnpay-test";
process.env.VNPAY_TMNCODE = "TEST";
process.env.ZALOPAY_KEY2 = "local-zalopay-test";
process.env.ZALOPAY_APPID = "1234";
const app = require("../app");
const Tour = require("../models/tour.model");
const Category = require("../models/category.model");
const City = require("../models/city.model");
const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const Account = require("../models/account-admin.model");
const Role = require("../models/role.model");
const ForgotPassword = require("../models/forgot-password.model");
const Coupon = require("../models/coupon.model");
const booking = require("../helpers/booking.helper");
const payment = require("../helpers/payment.helper");
const categories = require("../helpers/category.helper");
const { permissionList } = require("../config/variable.config");
let mongo, dbPath, city, root, child, leaf, tour, account, cookie;
const payload = (overrides = {}) => ({
  fullName: "Khách kiểm thử",
  phone: "0901234567",
  note: "",
  paymentMethod: "vnpay",
  items: [
    {
      tourId: tour.id,
      locationFrom: city.id,
      quantityAdult: 1,
      quantityChildren: 0,
      quantityBaby: 0,
    },
  ],
  ...overrides,
});
const token = (user) =>
  `token=${jwt.sign({ id: user.id, email: user.email, tokenVersion: user.tokenVersion || 0, purpose: "login" }, process.env.JWT_SECRET)}`;

before(async () => {
  dbPath = require("node:fs").mkdtempSync(
    require("node:path").join(process.cwd(), ".test-db-"),
  );
  mongo = await MongoMemoryReplSet.create({
    instanceOpts: [{ dbPath }],
    replSet: { count: 1, args: ["--nounixsocket"] },
    binary: { version: "7.0.24" },
  });
  await mongoose.connect(mongo.getUri());
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.init()),
  );
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  if (dbPath)
    require("node:fs").rmSync(dbPath, { recursive: true, force: true });
});
beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.deleteMany({})),
  );
  city = await City.create({ name: "Hà Nội" });
  root = await Category.create({
    name: "Hành trình Việt",
    parent: "",
    status: "active",
    position: 2,
  });
  child = await Category.create({
    name: "Miền Bắc",
    parent: root.id,
    status: "active",
  });
  leaf = await Category.create({
    name: "Hà Giang",
    parent: child.id,
    status: "active",
  });
  tour = await Tour.create({
    name: "Khám phá Hà Giang",
    category: leaf.id,
    status: "active",
    departureDate: new Date(Date.now() + 10 * 86400000),
    locations: [city.id],
    stockAdult: 2,
    stockChildren: 2,
    stockBaby: 2,
    priceAdult: 1200000,
    priceNewAdult: 1000000,
    priceChildren: 600000,
    priceNewChildren: 500000,
    priceBaby: 0,
    priceNewBaby: 0,
    images: ["https://example.com/old.jpg"],
    schedules: [],
    position: 1,
  });
  const role = await Role.create({
    name: "Quản trị",
    permissions: permissionList.map((item) => item.value),
  });
  account = await Account.create({
    fullName: "Nguyễn Hải Phong",
    email: "admin@example.com",
    password: await bcrypt.hash("Admin123!", 4),
    status: "active",
    role: role.id,
  });
  cookie = token(account);
});

test("Đặt tour hợp lệ lưu giá server và trừ đúng chỗ", async () => {
  const response = await request(app).post("/order/create").send(payload());
  assert.equal(response.body.code, "success");
  const order = await Order.findOne();
  assert.equal(order.total, 1000000);
  assert.equal((await Tour.findById(tour.id)).stockAdult, 1);
  assert.equal(order.items[0].cityName, "Hà Nội");
});
test("Số lượng âm, số lẻ, đơn rỗng và phương thức giả bị từ chối", async () => {
  for (const bad of [-3, 0.5, "1"]) {
    const body = payload();
    body.items[0].quantityAdult = bad;
    const response = await request(app).post("/order/create").send(body);
    assert.equal(response.status, 400);
  }
  assert.equal(
    (
      await request(app)
        .post("/order/create")
        .send(payload({ items: [] }))
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post("/order/create")
        .send(payload({ paymentMethod: "fake" }))
    ).status,
    400,
  );
  assert.equal((await Tour.findById(tour.id)).stockAdult, 2);
});
test("Hai đơn đồng thời không bán vượt số chỗ", async () => {
  await Tour.updateOne({ _id: tour.id }, { stockAdult: 1 });
  const results = await Promise.allSettled([
    booking.create(payload()),
    booking.create(payload()),
  ]);
  assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Tour.findById(tour.id)).stockAdult, 0);
});
test("Tour thứ hai không hợp lệ làm rollback toàn bộ chỗ", async () => {
  const body = payload();
  body.items.push({
    ...body.items[0],
    tourId: new mongoose.Types.ObjectId().toString(),
  });
  await assert.rejects(booking.create(body));
  assert.equal((await Tour.findById(tour.id)).stockAdult, 2);
  assert.equal(await Order.countDocuments(), 0);
});
test("Không đặt được tour sai điểm đi, đã qua ngày hoặc danh mục bị ẩn", async () => {
  const other = await City.create({ name: "Huế" });
  const body = payload();
  body.items[0].locationFrom = other.id;
  await assert.rejects(booking.create(body));
  await Tour.updateOne(
    { _id: tour.id },
    { departureDate: new Date(Date.now() - 86400000) },
  );
  await assert.rejects(booking.create(payload()));
  await Tour.updateOne(
    { _id: tour.id },
    { departureDate: new Date(Date.now() + 86400000) },
  );
  await Category.updateOne({ _id: root.id }, { status: "inactive" });
  await assert.rejects(booking.create(payload()));
});
test("Hết hạn giữ chỗ hoàn một lần và chuyển đơn sang hủy", async () => {
  const order = await booking.create(payload());
  await Order.updateOne(
    { _id: order.id },
    { reservationExpiresAt: new Date(Date.now() - 1000) },
  );
  await Promise.all([booking.releaseExpired(), booking.releaseExpired()]);
  assert.equal((await Tour.findById(tour.id)).stockAdult, 2);
  assert.equal((await Order.findById(order.id)).status, "cancel");
});
const attempt = async (order) =>
  Payment.create({
    reference: crypto.randomUUID(),
    orderId: order.id,
    provider: "vnpay",
    amount: order.total,
  });
const vnpQuery = (record, extra = {}) => {
  const query = {
    vnp_TmnCode: "TEST",
    vnp_TxnRef: record.reference,
    vnp_Amount: String(record.amount * 100),
    vnp_ResponseCode: "00",
    vnp_TransactionStatus: "00",
    vnp_TransactionNo: "123456",
    ...extra,
  };
  return { ...query, vnp_SecureHash: payment.signVNPay(query) };
};
test("VNPay thất bại có chữ ký hợp lệ không đánh dấu paid", async () => {
  const order = await booking.create(payload()),
    record = await attempt(order);
  const response = await request(app)
    .get("/order/payment-vnpay-ipn")
    .query(
      vnpQuery(record, { vnp_ResponseCode: "24", vnp_TransactionStatus: "02" }),
    );
  assert.equal(response.body.RspCode, "00");
  assert.equal((await Order.findById(order.id)).paymentStatus, "unpaid");
});
test("VNPay từ chối chữ ký sai và số tiền sai", async () => {
  const order = await booking.create(payload()),
    record = await attempt(order);
  assert.equal(
    (
      await request(app)
        .get("/order/payment-vnpay-ipn")
        .query({ ...vnpQuery(record), vnp_SecureHash: "fake" })
    ).body.RspCode,
    "97",
  );
  assert.equal(
    (
      await request(app)
        .get("/order/payment-vnpay-ipn")
        .query(vnpQuery(record, { vnp_Amount: "100" }))
    ).body.RspCode,
    "04",
  );
  assert.equal((await Order.findById(order.id)).paymentStatus, "unpaid");
});
test("Callback lặp được ghi nhận một lần; đơn paid không hết hạn", async () => {
  const order = await booking.create(payload()),
    record = await attempt(order);
  const first = await request(app)
    .get("/order/payment-vnpay-ipn")
    .query(vnpQuery(record));
  const second = await request(app)
    .get("/order/payment-vnpay-ipn")
    .query(vnpQuery(record));
  assert.equal(first.body.RspCode, "00");
  assert.equal(second.body.RspCode, "02");
  await Order.updateOne(
    { _id: order.id },
    { reservationExpiresAt: new Date(0) },
  );
  await booking.releaseExpired();
  assert.equal((await Tour.findById(tour.id)).stockAdult, 1);
  assert.equal((await Order.findById(order.id)).paymentReview, false);
});
test("Thanh toán đến sau khi hết hạn cần đối soát, không giữ chỗ lại", async () => {
  const order = await booking.create(payload()),
    record = await attempt(order);
  await Order.updateOne(
    { _id: order.id },
    { reservationExpiresAt: new Date(0) },
  );
  await booking.releaseExpired();
  await payment.settle("vnpay", record.reference, record.amount, true, "123");
  const saved = await Order.findById(order.id);
  assert.equal(saved.paymentReview, true);
  assert.equal(saved.status, "cancel");
  assert.equal(saved.paymentStatus, "paid");
  assert.equal((await Tour.findById(tour.id)).stockAdult, 2);
});
test("ZaloPay kiểm tra MAC, app_id và số tiền", async () => {
  const order = await booking.create(payload({ paymentMethod: "zalopay" }));
  const record = await Payment.create({
    reference: "261127_test",
    orderId: order.id,
    provider: "zalopay",
    amount: order.total,
  });
  const data = JSON.stringify({
    app_id: 1234,
    app_trans_id: record.reference,
    amount: order.total,
    zp_trans_id: 1,
  });
  assert.equal(
    (
      await request(app)
        .post("/order/payment-zalopay-result")
        .send({ data, mac: "bad" })
    ).body.return_code,
    -1,
  );
  const mac = crypto
    .createHmac("sha256", process.env.ZALOPAY_KEY2)
    .update(data)
    .digest("hex");
  assert.equal(
    (
      await request(app)
        .post("/order/payment-zalopay-result")
        .send({ data, mac })
    ).body.return_code,
    1,
  );
  assert.equal((await Order.findById(order.id)).paymentStatus, "paid");
});
test("API quản trị chặn quyền trước khi nhận tệp", async () => {
  const role = await Role.create({
    name: "Chỉ xem",
    permissions: ["tour-view"],
  });
  account.role = role.id;
  await account.save();
  for (const path of [
    "/admin/category/create",
    "/admin/tour/create",
    "/admin/setting/role/create",
  ]) {
    const response = await request(app)
      .post(path)
      .set("Cookie", cookie)
      .send({ name: "Bị chặn" });
    assert.equal(response.status, 403, path);
  }
  assert.equal(
    (
      await request(app)
        .patch("/admin/tour/change-multi")
        .set("Cookie", cookie)
        .send({ value: "delete", ids: [tour.id] })
    ).status,
    403,
  );
  assert.equal(
    (
      await request(app)
        .delete(`/admin/tour/destroy/${tour.id}`)
        .set("Cookie", cookie)
    ).status,
    403,
  );
});
test("Sửa hồ sơ không cho tự gán quyền; tài khoản thiếu nhóm vẫn render được", async () => {
  await request(app)
    .patch("/admin/profile/edit")
    .set("Cookie", cookie)
    .send({
      fullName: "Tên mới",
      email: account.email,
      phone: "0901234567",
      role: "fake",
      status: "inactive",
      password: "plain",
    });
  const saved = await Account.findById(account.id);
  assert.equal(saved.role, account.role);
  assert.equal(saved.status, "active");
  assert.notEqual(saved.password, "plain");
  saved.role = "";
  await saved.save();
  const response = await request(app)
    .get("/admin/profile/edit")
    .set("Cookie", cookie);
  assert.equal(response.status, 200);
  assert.match(response.text, /Chưa gán nhóm quyền/);
});
test("Khóa tài khoản và đổi mật khẩu vô hiệu hóa token cũ", async () => {
  await Account.updateOne({ _id: account.id }, { status: "inactive" });
  assert.equal(
    (await request(app).get("/admin/tour/list").set("Cookie", cookie)).status,
    302,
  );
  await Account.updateOne({ _id: account.id }, { status: "active" });
  const result = await request(app)
    .patch("/admin/profile/change-password")
    .set("Cookie", cookie)
    .send({ password: "NewPassword123!", role: "fake" });
  assert.equal(result.body.code, "success");
  assert.equal(
    (await request(app).get("/admin/tour/list").set("Cookie", cookie)).status,
    302,
  );
});
test("OTP hết hạn bị chặn, OTP đúng dùng một lần và không cấp token đăng nhập", async () => {
  const hash = crypto.createHash("sha256").update("123456").digest("hex");
  await ForgotPassword.create({
    email: account.email,
    otp: hash,
    expireAt: new Date(Date.now() - 10000),
  });
  const expired = await request(app)
    .post("/admin/account/otp-password")
    .send({ email: account.email, otp: "123456" });
  assert.equal(expired.body.code, "error");
  await ForgotPassword.deleteMany({});
  await ForgotPassword.create({
    email: account.email,
    otp: hash,
    expireAt: new Date(Date.now() + 60000),
  });
  const result = await request(app)
    .post("/admin/account/otp-password")
    .send({ email: account.email, otp: "123456" });
  assert.equal(result.body.code, "success");
  const resetCookie = result.headers["set-cookie"][0].split(";")[0];
  assert.match(resetCookie, /^resetToken=/);
  assert.equal(
    (await request(app).get("/admin/tour/list").set("Cookie", resetCookie))
      .status,
    302,
  );
  assert.equal(
    (
      await request(app)
        .post("/admin/account/otp-password")
        .send({ email: account.email, otp: "123456" })
    ).body.code,
    "error",
  );
  assert.equal(
    (
      await request(app)
        .post("/admin/account/reset-password")
        .set("Cookie", resetCookie)
        .send({ password: "ResetPass123!" })
    ).body.code,
    "success",
  );
  assert.equal(
    (
      await request(app)
        .post("/admin/account/reset-password")
        .set("Cookie", resetCookie)
        .send({ password: "ResetPass123!" })
    ).status,
    401,
  );
});
test("Danh mục nhiều cấp không mất con và ngăn vòng lặp", async () => {
  assert.deepEqual(
    (await categories.getCategoryChild(root.id)).map((item) => item.id),
    [child.id, leaf.id],
  );
  assert.deepEqual(
    (await categories.getCategoryParent(leaf.id)).map((item) => item.id),
    [root.id, child.id, leaf.id],
  );
  await assert.rejects(categories.validateParent(root.id, leaf.id));
});
test("Trang chủ không cần cấu hình, lấy danh mục tùy ý và tour cấp cháu", async () => {
  const response = await request(app).get("/");
  assert.equal(response.status, 200);
  assert.match(response.text, /Hành trình Việt/);
  assert.match(response.text, /Khám phá Hà Giang/);
  await Category.updateOne({ _id: root.id }, { status: "inactive" });
  const hidden = await request(app).get("/");
  assert.doesNotMatch(hidden.text, /Khám phá Hà Giang/);
  assert.equal(
    (await request(app).get(`/tour/detail/${tour.slug}`)).status,
    302,
  );
});
test("Tất cả trang admin render bằng dữ liệu thật", async () => {
  for (const path of [
    "/admin/dashboard",
    "/admin/tour/list",
    "/admin/tour/create",
    `/admin/tour/edit/${tour.id}`,
    "/admin/category/list",
    "/admin/category/create",
    `/admin/category/edit/${leaf.id}`,
    "/admin/tour/trash",
    "/admin/order/list",
    "/admin/user/list",
    "/admin/contact/list",
    "/admin/coupon/list",
    "/admin/setting/list",
    "/admin/setting/website-info",
    "/admin/setting/account-admin/list",
    "/admin/setting/account-admin/create",
    `/admin/setting/account-admin/edit/${account.id}`,
    "/admin/setting/role/list",
    "/admin/setting/role/create",
    `/admin/setting/role/edit/${account.role}`,
  ]) {
    const response = await request(app).get(path).set("Cookie", cookie);
    assert.equal(response.status, 200, path);
  }
});
test("Sửa/xóa ảnh, lọc tour và HTML độc hại", async () => {
  const response = await request(app)
    .patch(`/admin/tour/edit/${tour.id}`)
    .set("Cookie", cookie)
    .field("updatedAt", tour.updatedAt.toISOString())
    .field("name", "Tour mới")
    .field("category", leaf.id)
    .field("status", "active")
    .field("position", "3")
    .field("priceAdult", "1200000")
    .field("priceNewAdult", "1000000")
    .field("stockAdult", "2")
    .field("stockChildren", "2")
    .field("stockBaby", "2")
    .field("locations", JSON.stringify([city.id]))
    .field("departureDate", tour.departureDate.toISOString())
    .field("schedules", "[]")
    .field("clearImages", "true")
    .field(
      "information",
      '<p>Thông tin mới</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
    );
  assert.equal(response.body.code, "success", JSON.stringify(response.body));
  const saved = await Tour.findById(tour.id);
  assert.equal(saved.images.length, 0);
  assert.doesNotMatch(saved.information, /script|onerror/);
  const filtered = await request(app)
    .get("/admin/tour/list?keyword=khongtontai")
    .set("Cookie", cookie);
  assert.doesNotMatch(filtered.text, /Tour mới/);
});
test("Mã giảm giá tính theo server, hết hạn bị từ chối", async () => {
  await Coupon.create({
    code: "HEMOI",
    percent: 20,
    minTotal: 100000,
    maxDiscount: 100000,
    expiresAt: new Date(Date.now() + 60000),
  });
  const order = await booking.create(payload({ couponCode: "HEMOI" }));
  assert.equal(order.discount, 100000);
  assert.equal(order.total, 900000);
  await assert.rejects(booking.create(payload({ couponCode: "KHONGCO" })));
  assert.equal((await Tour.findById(tour.id)).stockAdult, 1);
});
test("Hủy đơn hoàn chỗ một lần; không mở lại đơn đã hủy", async () => {
  const order = await booking.create(payload({ paymentMethod: "money" }));
  const body = {
    fullName: order.fullName,
    phone: order.phone,
    note: "",
    paymentMethod: "money",
    paymentStatus: "unpaid",
    status: "cancel",
  };
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await request(app)
          .patch(`/admin/order/edit/${order.id}`)
          .set("Cookie", cookie)
          .send(body)
      ).body.code,
      "success",
    );
  assert.equal((await Tour.findById(tour.id)).stockAdult, 2);
  assert.equal(
    (
      await request(app)
        .patch(`/admin/order/edit/${order.id}`)
        .set("Cookie", cookie)
        .send({ ...body, status: "initial" })
    ).status,
    400,
  );
});
test("Email và mã đơn có unique index", async () => {
  await assert.rejects(
    Account.create({
      fullName: "Trùng",
      email: account.email,
      password: "x",
      status: "active",
    }),
    (error) => error.code === 11000,
  );
});

test("Biểu mẫu cũ không được ghi đè số chỗ vừa có khách đặt", async () => {
  await booking.create(payload());
  const response = await request(app)
    .patch(`/admin/tour/edit/${tour.id}`)
    .set("Cookie", cookie)
    .field("updatedAt", tour.updatedAt.toISOString())
    .field("name", tour.name)
    .field("category", leaf.id)
    .field("status", "active")
    .field("priceAdult", "1200000")
    .field("priceNewAdult", "1000000")
    .field("stockAdult", "2")
    .field("locations", JSON.stringify([city.id]))
    .field("departureDate", tour.departureDate.toISOString())
    .field("schedules", "[]");
  assert.equal(response.status, 409);
  assert.equal((await Tour.findById(tour.id)).stockAdult, 1);
});
test("Tạo/sửa/xóa danh mục, xóa/khôi phục tour phản ánh ra phía khách", async () => {
  const created = await request(app)
    .post("/admin/category/create")
    .set("Cookie", cookie)
    .field("name", "Danh mục mới")
    .field("parent", "")
    .field("status", "active")
    .field("position", "9")
    .field("description", "<p>Nội dung</p>");
  assert.equal(created.body.code, "success");
  const category = await Category.findOne({ name: "Danh mục mới" });
  const edited = await request(app)
    .patch(`/admin/category/edit/${category.id}`)
    .set("Cookie", cookie)
    .field("name", "Danh mục đổi tên")
    .field("parent", "")
    .field("status", "active")
    .field("position", "9")
    .field("description", "");
  assert.equal(edited.body.code, "success");
  assert.match((await request(app).get("/")).text, /Danh mục đổi tên/);
  assert.equal(
    (
      await request(app)
        .patch(`/admin/category/delete/${category.id}`)
        .set("Cookie", cookie)
    ).body.code,
    "success",
  );
  assert.doesNotMatch((await request(app).get("/")).text, /Danh mục đổi tên/);
  assert.equal(
    (
      await request(app)
        .patch(`/admin/tour/delete/${tour.id}`)
        .set("Cookie", cookie)
    ).body.code,
    "success",
  );
  assert.equal(
    (await request(app).get(`/tour/detail/${tour.slug}`)).status,
    302,
  );
  assert.equal(
    (
      await request(app)
        .patch(`/admin/tour/undo/${tour.id}`)
        .set("Cookie", cookie)
    ).body.code,
    "success",
  );
  assert.equal(
    (await request(app).get(`/tour/detail/${tour.slug}`)).status,
    200,
  );
});
test("Dashboard không tính doanh thu đơn chưa trả hoặc đã hủy", async () => {
  await booking.create(payload());
  const paid = await booking.create(payload({ paymentMethod: "money" }));
  await Order.updateOne({ _id: paid.id }, { paymentStatus: "paid" });
  const response = await request(app)
    .get("/admin/dashboard")
    .set("Cookie", cookie);
  assert.equal(response.status, 200);
  assert.match(response.text, /Doanh thu đã thanh toán/);
  assert.match(response.text, /1\.000\.000/);
  assert.doesNotMatch(response.text, /2\.000\.000/);
});

test("Trang danh mục, tìm kiếm, giỏ hàng và chi tiết đơn render đúng", async () => {
  const order = await booking.create(payload({ paymentMethod: "money" }));
  for (const path of [
    "/cart",
    "/search",
    `/category/${root.slug}`,
    `/tour/detail/${tour.slug}`,
    `/order/success?orderCode=${order.code}&phone=${order.phone}`,
    `/admin/order/edit/${order.id}`,
  ]) {
    const response = await request(app).get(path).set("Cookie", cookie);
    assert.equal(response.status, 200, path);
  }
});
test("Xóa tài khoản, nhóm quyền và đăng ký nhận tin có API thật", async () => {
  const other = await Account.create({
    fullName: "Nhân viên",
    email: "staff@example.com",
    password: "hash",
    status: "active",
  });
  assert.equal(
    (
      await request(app)
        .patch(`/admin/setting/account-admin/delete/${account.id}`)
        .set("Cookie", cookie)
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .patch(`/admin/setting/account-admin/delete/${other.id}`)
        .set("Cookie", cookie)
    ).body.code,
    "success",
  );
  assert.equal((await Account.findById(other.id)).deleted, true);
  assert.equal(
    (
      await request(app)
        .patch(`/admin/setting/role/delete/${account.role}`)
        .set("Cookie", cookie)
    ).status,
    400,
  );
  const unused = await Role.create({ name: "Nhóm chưa dùng", permissions: [] });
  assert.equal(
    (
      await request(app)
        .patch(`/admin/setting/role/delete/${unused.id}`)
        .set("Cookie", cookie)
    ).body.code,
    "success",
  );
  const Contact = require("../models/contact.model"),
    contact = await Contact.create({ email: "contact@example.com" });
  assert.equal(
    (
      await request(app)
        .patch(`/admin/contact/delete/${contact.id}`)
        .set("Cookie", cookie)
    ).body.code,
    "success",
  );
  assert.equal((await Contact.findById(contact.id)).deleted, true);
});
test("Cập nhật website không xóa logo cũ khi không tải ảnh; coupon preview dùng giá server", async () => {
  const Setting = require("../models/setting-website-info.model");
  await Setting.create({ websiteName: "Tên cũ", logo: "/logo-cu.png" });
  const response = await request(app)
    .patch("/admin/setting/website-info")
    .set("Cookie", cookie)
    .field("websiteName", "Tên mới")
    .field("categoryIdSection4", root.id)
    .field("bankName", "Ngân hàng kiểm thử")
    .field("bankAccountName", "Chu Tai Khoan")
    .field("bankAccountNumber", "123456789");
  assert.equal(response.body.code, "success");
  assert.equal((await Setting.findOne()).logo, "/logo-cu.png");
  await Coupon.create({
    code: "SALE10",
    percent: 10,
    expiresAt: new Date(Date.now() + 60000),
  });
  const result = await request(app)
    .post("/cart/coupon")
    .send({ couponCode: "SALE10", items: payload().items });
  assert.equal(result.body.discount, 100000);
});
test("Tạo tour từ form admin có thể mở chi tiết phía khách", async () => {
  const response = await request(app)
    .post("/admin/tour/create")
    .set("Cookie", cookie)
    .field("name", "Tour tạo mới")
    .field("category", leaf.id)
    .field("status", "active")
    .field("priceAdult", "1000000")
    .field("priceNewAdult", "900000")
    .field("stockAdult", "10")
    .field("locations", JSON.stringify([city.id]))
    .field("departureDate", tour.departureDate.toISOString())
    .field("schedules", "[]");
  assert.equal(response.body.code, "success", JSON.stringify(response.body));
  const created = await Tour.findOne({ name: "Tour tạo mới" });
  assert.equal(
    (await request(app).get(`/tour/detail/${created.slug}`)).status,
    200,
  );
});

test("Tour trong danh mục tạm dừng vẫn sửa được ở admin, không hiện phía khách", async () => {
  await Category.updateOne({ _id: leaf.id }, { status: "inactive" });
  const response = await request(app).patch(`/admin/tour/edit/${tour.id}`).set("Cookie", cookie)
    .field("updatedAt", tour.updatedAt.toISOString()).field("name", "Tour đang chuẩn bị").field("category", leaf.id).field("status", "inactive")
    .field("priceAdult", "1200000").field("priceNewAdult", "1000000").field("stockAdult", "2")
    .field("locations", JSON.stringify([city.id])).field("departureDate", tour.departureDate.toISOString()).field("schedules", "[]");
  assert.equal(response.body.code, "success");
  assert.equal((await request(app).get(`/tour/detail/${tour.slug}`)).status, 302);
});
