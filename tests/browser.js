const {
  createRequire
} = require("module");
const req = createRequire(process.cwd() + "/package.json");
const fs = require("fs"),
  path = require("path");
const mongoose = req("mongoose");
const {
  MongoMemoryReplSet
} = req("mongodb-memory-server");
const {
  chromium
} = req("playwright");
const tempPath = fs.mkdtempSync(path.join(process.cwd(), ".test-tmp-"));
process.env.TMPDIR = tempPath;
process.env.JWT_SECRET = "preview-local-test-secret-at-least-32-characters";
process.env.ZALOPAY_APPID = "test-app";
process.env.ZALOPAY_KEY1 = "test-key-one";
process.env.ZALOPAY_KEY2 = "test-key-two";
process.env.ZALOPAY_DOMAIN = "https://payment.example.test";
let mongo, server, browser, dbPath;
(async () => {
  dbPath = fs.mkdtempSync(path.join(process.cwd(), ".test-db-"));
  mongo = await MongoMemoryReplSet.create({
    instanceOpts: [{
      dbPath
    }],
    replSet: {
      count: 1,
      args: ["--nounixsocket"]
    },
    binary: {
      version: "7.0.24"
    },
  });
  await mongoose.connect(mongo.getUri());
  const Category = req("./models/category.model"),
    Tour = req("./models/tour.model"),
    Account = req("./models/account-admin.model"),
    Role = req("./models/role.model"),
    City = req("./models/city.model"),
    Order = req("./models/order.model");
  const city = await City.create({
    name: "Hà Nội"
  });
  const categories = await Category.create([{
      name: "Hành trình Việt Nam",
      parent: "",
      status: "active",
      position: 2
    },
    {
      name: "Hành trình mùa hè",
      parent: "",
      status: "active",
      position: 1
    },
  ]);
  const role = await Role.create({
    name: "Quản trị viên",
    permissions: req("./config/variable.config")
      .permissionList.map(
        (i) => i.value,
      ),
  });
  const account = await Account.create({
    fullName: "Hải Phong",
    email: "preview@example.com",
    status: "active",
    role: role.id,
    password: await req("bcryptjs")
      .hash("Preview123!", 4),
  });
  const names = [
    "Hà Giang · Chạm miền đá nở hoa",
    "Đà Nẵng · Một miền biển xanh",
    "Hội An · Những ngày bình yên",
    "Hạ Long · Giữa kỳ quan",
    "Đà Lạt · Đi tìm mùa xanh",
    "Ninh Bình · Dọc miền di sản",
  ];
  const tours = [];
  for(let i = 0; i < names.length; i++) {
    tours.push(
      await Tour.create({
        name: names[i],
        category: categories[0].id,
        status: i === 4 ? "inactive" : "active",
        position: 10 - i,
        avatar: "/assets/images/product-" + [1, 2, 3, 1, 2, 3][i] + ".jpg",
        images: ["/assets/images/product-1.jpg"],
        schedules: [{
          title: "Ngày 1",
          description: "Khởi hành và tham quan."
        }, ],
        information: "Trải nghiệm hành trình.",
        time: "3 ngày 2 đêm",
        priceAdult: 3500000,
        priceNewAdult: 2900000 + i * 100000,
        priceChildren: 2000000,
        priceNewChildren: 1800000,
        priceBaby: 500000,
        priceNewBaby: 500000,
        stockAdult: 18 - i * 2,
        stockChildren: 8,
        stockBaby: 5,
        locations: [city.id],
        departureDate: new Date(Date.now() + 10 * 86400000),
        createdBy: account.id,
        updatedBy: account.id,
      }),
    );
  }
  for(let i = 0; i < 5; i++) {
    await Order.create({
      code: "OD20261127000" + i,
      fullName: [
        "Nguyễn Minh Anh",
        "Trần Hoàng Nam",
        "Phạm Thu Hà",
        "Lê Thanh Tùng",
        "Vũ Ngọc Linh",
      ][i],
      phone: "090123456" + i,
      items: [{
        tourId: tours[i].id,
        locationFrom: city.id,
        name: tours[i].name,
        avatar: tours[i].avatar,
        quantityAdult: 2,
        quantityChildren: 0,
        quantityBaby: 0,
        priceNewAdult: tours[i].priceNewAdult,
        priceNewChildren: 1800000,
        priceNewBaby: 500000,
        departureDate: tours[i].departureDate,
      }, ],
      subTotal: tours[i].priceNewAdult * 2,
      total: tours[i].priceNewAdult * 2,
      paymentMethod: "bank",
      paymentStatus: i === 2 ? "unpaid" : "paid",
      status: i === 2 ? "initial" : "done",
    });
  }
  const app = req("./app");
  server = app.listen(5051, "127.0.0.1");
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"]
  });
  const context = await browser.newContext({
    viewport: {
      width: 1440,
      height: 1100
    },
    deviceScaleFactor: 1,
  });
  const errors = [];
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5051/admin/account/login", {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.fill("#email", "preview@example.com");
  await page.fill("#password", "Preview123!");
  await page.click("#login-form button");
  await page.waitForURL("**/admin/dashboard", {
    timeout: 20000
  });
  await page.locator(".notyf__toast")
    .waitFor({
      state: "hidden",
      timeout: 10000
    });
  fs.mkdirSync("docs/screenshots", {
    recursive: true
  });
  await page.screenshot({
    path: "docs/screenshots/admin-dashboard.png",
    fullPage: true,
  });
  await page.click(".inner-button-menu");
  if(!(await page.locator("body")
      .evaluate(element => element.classList.contains("nav-collapsed")))) {
    throw Error("Desktop collapse failed");
  }
  await page.click(".inner-button-menu");
  await page.goto("http://127.0.0.1:5051/admin/tour/list", {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.screenshot({
    path: "docs/screenshots/admin-tours.png",
    fullPage: true,
  });
  await page.locator("[search]")
    .fill("Hà Giang");
  await page.locator("[search]")
    .press("Enter");
  await page.waitForURL("**keyword=**");
  await page.waitForLoadState("networkidle");
  const rows = await page.locator(".table-2 tbody tr")
    .count();
  if(rows !== 1) {
    throw Error("Search rows " + rows);
  }
  await page.goto("http://127.0.0.1:5051/admin/tour/edit/" + tours[0].id, {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.screenshot({
    path: "docs/screenshots/admin-edit.png",
    fullPage: true,
  });
  await page.waitForFunction(() => filePond.avatar.getFile()
    ?.file?.size > 0 && filePondMulti.images.getFiles()
    .every(item => item.file?.size > 0));
  const originalImages = [...tours[0].images];
  for(const name of ["Hà Giang · Hành trình mới", "Hà Giang · Lưu lần hai"]) {
    await page.fill("#name", name);
    const savedResponse = page.waitForResponse(response => response.url()
      .includes("/tour/edit/") && response.request()
      .method() === "PATCH");
    await page.click("#tour-edit-form button[type=submit]");
    const result = await (await savedResponse)
      .json();
    if(result.code !== "success") {
      throw Error("Tour save failed: " + JSON.stringify(result));
    }
    const saved = await Tour.findById(tours[0].id);
    if(saved.name !== name || JSON.stringify(saved.images) !== JSON.stringify(originalImages)) {
      throw Error("Tour save changed images or name");
    }
  }
  await page.locator(".inner-upload-image-multi .filepond--action-remove-item")
    .click();
  const removedResponse = page.waitForResponse(response => response.url()
    .includes("/tour/edit/") && response.request()
    .method() === "PATCH");
  await page.click("#tour-edit-form button[type=submit]");
  if((await (await removedResponse)
      .json())
    .code !== "success" || (await Tour.findById(tours[0].id))
    .images.length) {
    throw Error("Remove gallery image failed");
  }
  for(const [route, screenshot] of [
      ["category/list", "admin-categories"],
      ["order/list", "admin-orders"],
      ["setting/list", "admin-settings"]
    ]) {
    await page.goto("http://127.0.0.1:5051/admin/" + route, {
      waitUntil: "networkidle",
      timeout: 45000
    });
    await page.screenshot({
      path: `docs/screenshots/${screenshot}.png`,
      fullPage: true
    });
  }
  for(const [label, path] of [
      ["Thông tin liên hệ", "contact/list"],
      ["Tài khoản quản trị", "setting/account-admin/list"],
      ["Phân quyền", "setting/role/list"]
    ]) {
    await page.locator(".sider .inner-menu")
      .getByRole("link", {
        name: label,
        exact: true
      })
      .click();
    await page.waitForURL("**/admin/" + path);
    await page.waitForLoadState("networkidle");
    const activeLinks = page.locator(".sider .inner-menu a.active");
    if(await activeLinks.count() !== 1 || await activeLinks.first()
      .getAttribute("href") !== "/admin/" + path) {
      throw Error("Wrong active menu: " + JSON.stringify({
        path,
        url: page.url(),
        links: await activeLinks.evaluateAll(items => items.map(item => item.getAttribute(
          "href"))),
        errors
      }));
    }
  }
  await page.locator(".table-2 .inner-edit")
    .first()
    .click();
  await page.waitForURL("**/admin/setting/role/edit/**");
  if(await page.locator(".sider .inner-menu a.active")
    .getAttribute("href") !== "/admin/setting/role/list") {
    throw Error("Role edit lost active menu");
  }
  const mobile = await browser.newContext({
    viewport: {
      width: 390,
      height: 844
    },
    deviceScaleFactor: 1,
  });
  await mobile.addCookies(await context.cookies());
  const mobilePage = await mobile.newPage();
  mobilePage.on("pageerror", (e) => errors.push(e.message));
  await mobilePage.goto("http://127.0.0.1:5051/admin/dashboard", {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  const dimensions = await mobilePage.evaluate(() => ({
    body: document.documentElement.scrollWidth,
    screen: innerWidth,
  }));
  if(dimensions.body > dimensions.screen + 1) {
    throw Error("Mobile overflow " + JSON.stringify(dimensions));
  }
  await mobilePage.screenshot({
    path: "docs/screenshots/admin-mobile.png",
    fullPage: true,
  });
  await mobilePage.click(".inner-button-menu");
  if((await mobilePage.locator(".inner-button-menu")
      .getAttribute("aria-expanded")) !== "true") {
    throw Error("Mobile nav failed");
  }
  await mobilePage.keyboard.press("Escape");
  if((await mobilePage.locator(".inner-button-menu")
      .getAttribute("aria-expanded")) !== "false") {
    throw Error("Escape did not close mobile nav");
  }
  await mobilePage.click(".inner-button-menu");
  await mobilePage.click(".sider-overlay", {
    position: {
      x: 350,
      y: 30
    }
  });
  await mobilePage.goto("http://127.0.0.1:5051/admin/tour/list", {
    waitUntil: "networkidle",
    timeout: 45000
  });
  await mobilePage.screenshot({
    path: "docs/screenshots/admin-mobile-tours.png",
    fullPage: true
  });
  const listWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  if(listWidth > 391) {
    throw Error("Mobile tour list overflow " + listWidth);
  }
  await mobilePage.goto("http://127.0.0.1:5051/admin/tour/edit/" + tours[0].id, {
    waitUntil: "networkidle",
    timeout: 45000
  });
  await mobilePage.screenshot({
    path: "docs/screenshots/admin-mobile-edit.png",
    fullPage: true
  });
  const formWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  if(formWidth > 391) {
    throw Error("Mobile form overflow " + formWidth);
  }
  // ZaloPay lần đầu phải gửi đúng tour; quay lại không giữ giỏ cũ trên màn hình.
  await page.goto("http://127.0.0.1:5051/cart", { waitUntil: "networkidle" });
  await page.evaluate(item => localStorage.setItem("cart", JSON.stringify([item])), {
    tourId: tours[1].id,
    locationFrom: city.id,
    checked: true,
    quantityAdult: 1,
    quantityChildren: 0,
    quantityBaby: 0
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.fill("#fullname-input", "Khách kiểm tra ZaloPay");
  await page.fill("#phone-input", "0901234567");
  await page.check("#methodZaloPay");
  await page.route("**/order/payment-zalopay?**", route => route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<h1>Payment handoff test</h1>"
  }));
  const checkoutResponse = page.waitForResponse(response => response.url().endsWith("/order/create") && response.request().method() === "POST");
  await page.locator("#order-form .inner-button button").click();
  const checkout = await checkoutResponse;
  const sent = checkout.request().postDataJSON();
  if(sent.paymentMethod !== "zalopay" || sent.items.length !== 1 || sent.items[0].quantityAdult !== 1) {
    throw Error("Wrong first ZaloPay checkout payload");
  }
  await page.waitForURL("**/order/payment-zalopay?**");
  const createdOrder = await Order.findOne({
    phone: "0901234567",
    paymentMethod: "zalopay"
  });
  if(checkout.status() !== 200 || !createdOrder || createdOrder.items.length !== 1) {
    throw Error("ZaloPay order creation failed");
  }
  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll("[cart-list] .inner-tour-item").length === 0);
  if(await page.locator("[cart-total]").textContent() !== "0") {
    throw Error("Cart total is stale after returning from payment");
  }
  await page.unroute("**/order/payment-zalopay?**");
  for(const broken of ["{", "{}", '[null,1,{"tourId":"bad"}]']) {
    await page.evaluate(value => localStorage.setItem("cart", value), broken);
    await page.goto("http://127.0.0.1:5051/cart", {
      waitUntil: "networkidle",
      timeout: 45000
    });
    const cartSize = await page.evaluate(() => JSON.parse(localStorage.getItem("cart"))
      .length);
    if(cartSize !== 0) {
      throw Error("Invalid old cart was not reset");
    }
  }
  await page.goto("http://127.0.0.1:5051/", {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await page.screenshot({
    path: "docs/screenshots/home.png",
    fullPage: true
  });
  await Tour.updateOne({
    _id: tours[0].id
  }, {
    departureDate: null,
    stockAdult: 0,
    stockChildren: 0,
    stockBaby: 0
  });
  const legacyTour = await Tour.findById(tours[0].id);
  await page.goto("http://127.0.0.1:5051/tour/detail/" + legacyTour.slug, {
    waitUntil: "networkidle",
    timeout: 45000
  });
  if(await page.locator(".inner-button-add-cart").count()) {
    throw Error("Tour without departure/stock must not accept bookings");
  }
  if(errors.length) {
    throw Error("Browser errors: " + errors.join("; "));
  }
  console.log(
    JSON.stringify({
      browserErrors: errors,
      mobile: dimensions,
      searchRows: rows,
      repeatedSaves: 2,
      retainedImages: true,
      removedGallery: true,
      mobileListWidth: listWidth,
      mobileFormWidth: formWidth,
      screenshots: "docs/screenshots",
    }),
  );
})()
.catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if(browser) {
      await browser.close();
    }
    if(server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    if(mongo) {
      await mongo.stop();
    }
    if(dbPath) {
      fs.rmSync(dbPath, {
        recursive: true,
        force: true
      });
    }
    fs.rmSync(tempPath, {
      recursive: true,
      force: true
    });
  });
