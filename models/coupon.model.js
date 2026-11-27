const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  percent: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  minTotal: {
    type: Number,
    min: 0,
    default: 0
  },
  maxDiscount: {
    type: Number,
    min: 0,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },
  updatedBy: String
}, {
  timestamps: true
});
module.exports = mongoose.model("Coupon", schema, "coupons");
