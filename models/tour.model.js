const mongoose = require('mongoose');
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: String,
  position: Number,
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "inactive"
  },
  avatar: String,
  images: Array,
  priceAdult: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  priceChildren: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  priceBaby: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  priceNewAdult: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  priceNewChildren: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  priceNewBaby: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  stockAdult: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  stockChildren: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  stockBaby: {
    type: Number,
    min: 0,
    default: 0,
    validate: Number.isSafeInteger
  },
  locations: Array,
  time: String,
  vehicle: String,
  departureDate: Date,
  information: String,
  schedules: Array,
  createdBy: String,
  updatedBy: String,
  slug: {
    type: String,
    slug: "name",
    unique: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedBy: String,
  deletedAt: Date
}, {
  timestamps: true // Tự động tạo ra 2 trường createdAt và updatedAt
});

schema.index({
  deleted: 1,
  status: 1,
  category: 1,
  position: -1
});

const Tour = mongoose.model('Tour', schema, "tours");

module.exports = Tour;
