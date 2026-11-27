const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  tourId: { type: String, required: true }, locationFrom: { type: String, required: true },
  quantityAdult: { type: Number, min: 0, required: true }, quantityChildren: { type: Number, min: 0, required: true }, quantityBaby: { type: Number, min: 0, required: true },
  priceNewAdult: { type: Number, min: 0 }, priceNewChildren: { type: Number, min: 0 }, priceNewBaby: { type: Number, min: 0 },
  departureDate: Date, avatar: String, name: String, slug: String, cityName: String
}, { _id: false });

const schema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  fullName: { type: String, required: true, trim: true }, phone: { type: String, required: true }, note: String,
  items: [itemSchema], subTotal: { type: Number, min: 0 }, discount: { type: Number, min: 0, default: 0 }, total: { type: Number, min: 0 },
  couponCode: String, paymentMethod: { type: String, enum: ["money", "bank", "vnpay", "zalopay", "momo"] },
  paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  status: { type: String, enum: ["initial", "done", "cancel"], default: "initial" },
  reservationExpiresAt: Date, stockReleased: { type: Boolean, default: false }, paymentReview: { type: Boolean, default: false },
  paidAttempt: String, paidAt: Date, updatedBy: String,
  deleted: { type: Boolean, default: false }, deletedBy: String, deletedAt: Date
}, { timestamps: true });
schema.index({ deleted: 1, createdAt: -1 });
schema.index({ paymentStatus: 1, status: 1, reservationExpiresAt: 1 });
module.exports = mongoose.model("Order", schema, "orders");
