const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true,
    trim: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['email', 'phone'],
    default: 'phone'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // MongoDB TTL index: automatically deletes document after 5 minutes (300 seconds)
  }
});

module.exports = mongoose.model('Otp', otpSchema);

