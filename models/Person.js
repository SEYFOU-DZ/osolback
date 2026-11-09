const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
  wsId: { type: String, required: true, index: true },
  walletId: { type: String },
  name: { type: String, required: true },
  phone: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Person', PersonSchema);
