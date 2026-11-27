require("dotenv").config();
const mongoose = require("mongoose");
(async () => {
  await mongoose.connect(process.env.DATABASE);
  for(const [collection, field] of [["accounts-admin", "email"], ["orders", "code"]]) {
    const duplicates = await mongoose.connection.collection(collection).aggregate([{ $group: { _id: "$" + field, count: { $sum: 1 } } }, { $match: { $or: [{ count: { $gt: 1 } }, { _id: null }, { _id: "" }] } }, { $count: "groups" }]).toArray();
    console.log(`${collection}: ${duplicates[0]?.groups || 0} nhóm dữ liệu trùng hoặc thiếu ${field}.`);
    if(duplicates.length) process.exitCode = 1;
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
