const mongoose = require('mongoose');

const DebtSchema = new mongoose.Schema({
  wsId: { type: String, required: true, index: true },
  personId: { type: String, required: true, index: true },
  direction: { type: String, enum: ['for', 'against'], required: true },
  amount: { type: Number, required: true },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  dueDate: { type: String },
  interest: { type: Number },
  note: { type: String, default: '' },
  payments: [
    {
      id: { type: String },
      amount: { type: Number, required: true },
      date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
      note: { type: String, default: '' }
    }
  ],
  edited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Debt', DebtSchema);
