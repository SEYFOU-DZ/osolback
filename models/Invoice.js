const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  itemId: { type: String },
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true, default: 0 }
});

const InvoiceSchema = new mongoose.Schema({
  wsId: { type: String, required: true, index: true },
  number: { type: String, required: true },
  client: { type: String, required: true },
  clientPhone: { type: String },
  date: { type: String },
  dueDate: { type: String },
  items: [InvoiceItemSchema],
  vatRate: { type: Number, default: 15 },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue'], default: 'draft' },
  paidAmount: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
