const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  kind: { type: String, enum: ['personal', 'business'], default: 'personal' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  logo: { type: String },
  stamp: { type: String },
  vatNumber: { type: String },
  phone: { type: String },
  address: { type: String },
  currency: { type: String, default: 'SAR' },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      email: { type: String },
      role: { type: String, enum: ['owner', 'accountant', 'viewer'], default: 'viewer' }
    }
  ],
  modules: {
    warehouse: { type: Boolean, default: true },
    invoices: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
