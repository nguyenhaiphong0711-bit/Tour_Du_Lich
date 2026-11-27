const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  reference: { type: String, unique: true, required: true }, orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  provider: { type: String, enum: ["vnpay", "zalopay"], required: true }, amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" }, providerTransaction: String, paidAt: Date
}, { timestamps: true });
module.exports = mongoose.model("Payment", schema, "payments");
