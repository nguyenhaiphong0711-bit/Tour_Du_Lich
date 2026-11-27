const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: String,
  otp: String,
  attempts: {
    type: Number,
    default: 0
  },
  expireAt: {
    type: Date,
    expires: 0
  }
}, {
  timestamps: true // Tự động tạo ra 2 trường createdAt và updatedAt
});

const ForgotPassword = mongoose.model('ForgotPassword', schema, "forgot-password");

module.exports = ForgotPassword;
