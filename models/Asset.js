const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  wsId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  code: { type: String },
  category: { type: String, required: true, default: 'أخرى' },
  currency: { type: String, default: 'ر.س' },
  purchaseDate: { type: String },
  purchaseValue: { type: Number, required: true, default: 0 },
  currentValue: { type: Number, required: true, default: 0 },
  expenses: [
    {
      id: { type: String },
      label: { type: String, required: true },
      amount: { type: Number, required: true },
      date: { type: String }
    }
  ],
  plateNo: { type: String },
  insuranceUntil: { type: String },
  inspectionUntil: { type: String },
  registrationUntil: { type: String },
  sold: { type: Boolean, default: false },
  soldPrice: { type: Number },
  soldDate: { type: String },
  occupancy: { type: String, enum: ['vacant', 'rented'], default: 'vacant' },
  rentAmount: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Asset', AssetSchema);
