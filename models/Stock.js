const mongoose = require('mongoose');

const StockItemSchema = new mongoose.Schema({
  wsId: { type: String, required: true, index: true },
  warehouseId: { type: String },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String, default: 'عام' },
  quantity: { type: Number, default: 0 },
  minQuantity: { type: Number, default: 5 },
  unitPrice: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const StockMovementSchema = new mongoose.Schema({
  wsId: { type: String, required: true, index: true },
  itemId: { type: String, required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  qty: { type: Number, required: true },
  date: { type: String },
  ref: { type: String }
});

const StockItem = mongoose.model('StockItem', StockItemSchema);
const StockMovement = mongoose.model('StockMovement', StockMovementSchema);

module.exports = { StockItem, StockMovement };
