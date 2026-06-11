const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
});

module.exports = mongoose.model('IdempotencyKey', keySchema);
