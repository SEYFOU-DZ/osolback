const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  wsId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wallet', WalletSchema);
