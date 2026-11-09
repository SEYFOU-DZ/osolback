const Workspace = require('../models/Workspace');
const Asset = require('../models/Asset');
const Debt = require('../models/Debt');
const Person = require('../models/Person');
const Wallet = require('../models/Wallet');
const { StockItem, StockMovement } = require('../models/Stock');
const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');
const { isMongo, getLocalData, saveLocalData } = require('../config/db');

// Helper to uniform IDs
const normId = (doc) => {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id) {
    obj.id = obj._id.toString();
  }
  return obj;
};

// --- مساحات العمل Workspaces ---
exports.getWorkspaces = async (req, res) => {
  try {
    if (isMongo()) {
      const workspaces = await Workspace.find({
        $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }, { 'members.email': req.user.email }]
      });
      return res.json(workspaces.map(normId));
    }
    const workspaces = getLocalData('workspaces');
    const userWs = workspaces.filter(
      (w) => w.ownerId === req.user.id || w.members?.some((m) => m.email === req.user.email)
    );
    res.json(userWs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createWorkspace = async (req, res) => {
  try {
    if (isMongo()) {
      const ws = await Workspace.create({
        ...req.body,
        ownerId: req.user._id,
        members: [{ userId: req.user._id, name: req.user.name, email: req.user.email, role: 'owner' }]
      });
      return res.status(201).json(normId(ws));
    }
    const workspaces = getLocalData('workspaces');
    const newWs = {
      id: 'ws_' + Date.now().toString(36),
      ...req.body,
      ownerId: req.user.id,
      members: [{ id: req.user.id, name: req.user.name, email: req.user.email, role: 'owner' }],
      createdAt: new Date().toISOString()
    };
    workspaces.push(newWs);
    saveLocalData('workspaces', workspaces);
    res.status(201).json(newWs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- الأصول Assets ---
exports.getAssets = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const assets = await Asset.find({ wsId });
      return res.json(assets.map(normId));
    }
    const assets = getLocalData('assets').filter((a) => a.wsId === wsId);
    res.json(assets);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createAsset = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const asset = await Asset.create({ ...req.body, wsId });
      return res.status(201).json(normId(asset));
    }
    const assets = getLocalData('assets');
    const newAsset = { id: 'ast_' + Date.now().toString(36), wsId, expenses: [], createdAt: new Date().toISOString(), ...req.body };
    assets.push(newAsset);
    saveLocalData('assets', assets);
    res.status(201).json(newAsset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      const asset = await Asset.findOneAndUpdate({ $or: [{ _id: id }, { id: id }] }, req.body, { new: true });
      return res.json(normId(asset));
    }
    const assets = getLocalData('assets');
    const idx = assets.findIndex((a) => a.id === id);
    if (idx === -1) return res.status(404).json({ message: 'الأصل غير موجود' });
    assets[idx] = { ...assets[idx], ...req.body };
    saveLocalData('assets', assets);
    res.json(assets[idx]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      await Asset.findOneAndDelete({ $or: [{ _id: id }, { id: id }] });
      return res.json({ message: 'تم حذف الأصل بنجاح' });
    }
    let assets = getLocalData('assets');
    assets = assets.filter((a) => a.id !== id);
    saveLocalData('assets', assets);
    res.json({ message: 'تم حذف الأصل بنجاح' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addAssetExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      const asset = await Asset.findOne({ $or: [{ _id: id }, { id: id }] });
      if (!asset) return res.status(404).json({ message: 'الأصل غير موجود' });
      asset.expenses.push(req.body);
      await asset.save();
      return res.json(normId(asset));
    }
    const assets = getLocalData('assets');
    const asset = assets.find((a) => a.id === id);
    if (!asset) return res.status(404).json({ message: 'الأصل غير موجود' });
    if (!asset.expenses) asset.expenses = [];
    const expense = { id: 'exp_' + Date.now().toString(36), date: new Date().toISOString().slice(0, 10), ...req.body };
    asset.expenses.push(expense);
    saveLocalData('assets', assets);
    res.json(asset);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- المحافظ Wallets ---
exports.getWallets = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const wallets = await Wallet.find({ wsId });
      return res.json(wallets.map(normId));
    }
    const wallets = getLocalData('wallets').filter((w) => w.wsId === wsId);
    res.json(wallets);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createWallet = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const wallet = await Wallet.create({ ...req.body, wsId });
      return res.status(201).json(normId(wallet));
    }
    const wallets = getLocalData('wallets');
    const newWallet = { id: 'wal_' + Date.now().toString(36), wsId, ...req.body, createdAt: new Date().toISOString() };
    wallets.push(newWallet);
    saveLocalData('wallets', wallets);
    res.status(201).json(newWallet);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- الأشخاص والديون People & Debts ---
exports.getPeople = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const people = await Person.find({ wsId });
      return res.json(people.map(normId));
    }
    const people = getLocalData('people').filter((p) => p.wsId === wsId);
    res.json(people);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createPerson = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const person = await Person.create({ ...req.body, wsId });
      return res.status(201).json(normId(person));
    }
    const people = getLocalData('people');
    const newPerson = { id: 'prs_' + Date.now().toString(36), wsId, createdAt: new Date().toISOString(), ...req.body };
    people.push(newPerson);
    saveLocalData('people', people);
    res.status(201).json(newPerson);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deletePerson = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      await Person.findOneAndDelete({ $or: [{ _id: id }, { id: id }] });
      // حذف ديون الشخص أيضاً
      await Debt.deleteMany({ personId: id });
      return res.json({ message: 'تم حذف الشخص' });
    }
    let people = getLocalData('people');
    people = people.filter((p) => p.id !== id);
    saveLocalData('people', people);
    let debts = getLocalData('debts');
    debts = debts.filter((d) => d.personId !== id);
    saveLocalData('debts', debts);
    res.json({ message: 'تم حذف الشخص' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDebts = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const debts = await Debt.find({ wsId });
      return res.json(debts.map(normId));
    }
    const debts = getLocalData('debts').filter((d) => d.wsId === wsId);
    res.json(debts);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createDebt = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const debt = await Debt.create({ ...req.body, wsId });
      return res.status(201).json(normId(debt));
    }
    const debts = getLocalData('debts');
    const newDebt = { id: 'dbt_' + Date.now().toString(36), wsId, payments: [], edited: false, createdAt: new Date().toISOString(), ...req.body };
    debts.push(newDebt);
    saveLocalData('debts', debts);
    res.status(201).json(newDebt);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateDebt = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      const debt = await Debt.findOneAndUpdate(
        { $or: [{ _id: id }, { id: id }] },
        { ...req.body, edited: true },
        { new: true }
      );
      return res.json(normId(debt));
    }
    const debts = getLocalData('debts');
    const idx = debts.findIndex((d) => d.id === id);
    if (idx === -1) return res.status(404).json({ message: 'القيد غير موجود' });
    debts[idx] = { ...debts[idx], ...req.body, edited: true };
    saveLocalData('debts', debts);
    res.json(debts[idx]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteDebt = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      await Debt.findOneAndDelete({ $or: [{ _id: id }, { id: id }] });
      return res.json({ message: 'تم حذف القيد' });
    }
    let debts = getLocalData('debts');
    debts = debts.filter((d) => d.id !== id);
    saveLocalData('debts', debts);
    res.json({ message: 'تم حذف القيد' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addDebtPayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      const debt = await Debt.findOne({ $or: [{ _id: id }, { id: id }] });
      if (!debt) return res.status(404).json({ message: 'الدين غير موجود' });
      debt.payments.push(req.body);
      await debt.save();
      return res.json(normId(debt));
    }
    const debts = getLocalData('debts');
    const debt = debts.find((d) => d.id === id);
    if (!debt) return res.status(404).json({ message: 'القيد غير موجود' });
    if (!debt.payments) debt.payments = [];
    const payment = { id: 'pay_' + Date.now().toString(36), date: new Date().toISOString().slice(0, 10), ...req.body };
    debt.payments.push(payment);
    saveLocalData('debts', debts);
    res.json(debt);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- المستودع Warehouse & Stock ---
exports.getStock = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const stock = await StockItem.find({ wsId });
      return res.json(stock.map(normId));
    }
    const stock = getLocalData('stock').filter((s) => s.wsId === wsId);
    res.json(stock);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createStockItem = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const item = await StockItem.create({ ...req.body, wsId });
      return res.status(201).json(normId(item));
    }
    const stock = getLocalData('stock');
    const newItem = { id: 'stk_' + Date.now().toString(36), wsId, createdAt: new Date().toISOString(), ...req.body };
    stock.push(newItem);
    saveLocalData('stock', stock);
    res.status(201).json(newItem);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      const item = await StockItem.findOneAndUpdate({ $or: [{ _id: id }, { id: id }] }, req.body, { new: true });
      return res.json(normId(item));
    }
    const stock = getLocalData('stock');
    const idx = stock.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ message: 'الصنف غير موجود' });
    stock[idx] = { ...stock[idx], ...req.body };
    saveLocalData('stock', stock);
    res.json(stock[idx]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      await StockItem.findOneAndDelete({ $or: [{ _id: id }, { id: id }] });
      return res.json({ message: 'تم حذف الصنف' });
    }
    let stock = getLocalData('stock');
    stock = stock.filter((s) => s.id !== id);
    saveLocalData('stock', stock);
    res.json({ message: 'تم حذف الصنف' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.recordStockMovement = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    const { itemId, type, qty, ref } = req.body;
    const numQty = Number(qty);

    if (isMongo()) {
      const item = await StockItem.findOne({ $or: [{ _id: itemId }, { id: itemId }] });
      if (!item) return res.status(404).json({ message: 'الصنف غير موجود' });
      if (type === 'out' && item.quantity < numQty) {
        return res.status(400).json({ message: 'الكمية المتوفرة لا تكفي لإتمام حركة الصرف' });
      }
      item.quantity = type === 'in' ? item.quantity + numQty : item.quantity - numQty;
      await item.save();
      const movement = await StockMovement.create({ wsId, itemId, type, qty: numQty, ref, date: new Date().toISOString() });
      return res.json({ item: normId(item), movement: normId(movement) });
    }

    const stock = getLocalData('stock');
    const movements = getLocalData('movements');
    const item = stock.find((s) => s.id === itemId);
    if (!item) return res.status(404).json({ message: 'الصنف غير موجود' });
    if (type === 'out' && item.quantity < numQty) {
      return res.status(400).json({ message: 'الكمية المتوفرة لا تكفي لإتمام حركة الصرف' });
    }
    item.quantity = type === 'in' ? item.quantity + numQty : item.quantity - numQty;
    saveLocalData('stock', stock);

    const movement = { id: 'mov_' + Date.now().toString(36), wsId, itemId, type, qty: numQty, ref, date: new Date().toISOString() };
    movements.push(movement);
    saveLocalData('movements', movements);
    res.json({ item, movement });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// --- الفواتير Invoices & PDF ---
exports.getInvoices = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const invoices = await Invoice.find({ wsId });
      return res.json(invoices.map(normId));
    }
    const invoices = getLocalData('invoices').filter((i) => i.wsId === wsId);
    res.json(invoices);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createInvoice = async (req, res) => {
  try {
    const wsId = req.params.wsId;
    if (isMongo()) {
      const invoice = await Invoice.create({ ...req.body, wsId });
      return res.status(201).json(normId(invoice));
    }
    const invoices = getLocalData('invoices');
    const newInv = { id: 'inv_' + Date.now().toString(36), wsId, createdAt: new Date().toISOString(), ...req.body };
    invoices.push(newInv);
    saveLocalData('invoices', invoices);
    res.status(201).json(newInv);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      const invoice = await Invoice.findOneAndUpdate({ $or: [{ _id: id }, { id: id }] }, req.body, { new: true });
      return res.json(normId(invoice));
    }
    const invoices = getLocalData('invoices');
    const idx = invoices.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    invoices[idx] = { ...invoices[idx], ...req.body };
    saveLocalData('invoices', invoices);
    res.json(invoices[idx]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongo()) {
      await Invoice.findOneAndDelete({ $or: [{ _id: id }, { id: id }] });
      return res.json({ message: 'تم حذف الفاتورة' });
    }
    let invoices = getLocalData('invoices');
    invoices = invoices.filter((i) => i.id !== id);
    saveLocalData('invoices', invoices);
    res.json({ message: 'تم حذف الفاتورة' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// توليد وتحميل الفاتورة PDF
exports.downloadInvoicePDF = async (req, res) => {
  try {
    let inv, ws;
    if (isMongo()) {
      inv = await Invoice.findOne({ $or: [{ _id: req.params.id }, { id: req.params.id }] });
      if (inv) ws = await Workspace.findOne({ $or: [{ _id: inv.wsId }, { id: inv.wsId }] });
    } else {
      const invoices = getLocalData('invoices');
      inv = invoices.find((i) => i.id === req.params.id);
      if (inv) {
        const workspaces = getLocalData('workspaces');
        ws = workspaces.find((w) => w.id === inv.wsId);
      }
    }

    if (!inv) return res.status(404).json({ message: 'الفاتورة غير موجودة' });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${inv.number}.pdf`);

    doc.pipe(res);

    doc.fontSize(22).fillColor('#101C32').text('OSOOL - فاتورة مالية', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#D8B36A').text(`المؤسسة: ${ws ? ws.name : 'أصول'}`, { align: 'center' });
    doc.moveDown(1);
    doc.strokeColor('#D8B36A').lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    const startY = doc.y;
    doc.fontSize(10).fillColor('#333333');
    doc.text(`رقم الفاتورة: ${inv.number}`, 40, startY);
    doc.text(`تاريخ الإصدار: ${new Date(inv.date || Date.now()).toLocaleDateString('en-GB')}`, 40, startY + 15);
    doc.text(`العميل: ${inv.client}`, 320, startY);
    doc.text(`حالة الفاتورة: ${(inv.status || 'draft').toUpperCase()}`, 320, startY + 15);

    doc.moveDown(3);

    const tableTop = doc.y + 15;
    doc.fontSize(11).fillColor('#101C32');
    doc.text('البند / الوصف', 40, tableTop, { bold: true });
    doc.text('الكمية', 280, tableTop);
    doc.text('السعر', 370, tableTop);
    doc.text('الإجمالي', 470, tableTop);
    doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

    let curY = tableTop + 25;
    let subtotal = 0;

    (inv.items || []).forEach((item) => {
      const lineTotal = (item.qty || 1) * (item.price || 0);
      subtotal += lineTotal;
      doc.fontSize(10).fillColor('#444444');
      doc.text(item.name || '-', 40, curY);
      doc.text(String(item.qty || 1), 280, curY);
      doc.text(`${item.price || 0} SAR`, 370, curY);
      doc.text(`${lineTotal.toFixed(2)} SAR`, 470, curY);
      curY += 20;
    });

    doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(40, curY + 5).lineTo(555, curY + 5).stroke();
    curY += 15;

    const vatAmount = subtotal * ((inv.vatRate || 15) / 100);
    const total = subtotal + vatAmount;

    doc.fontSize(10).fillColor('#222222');
    doc.text(`المجموع الفرعي: ${subtotal.toFixed(2)} SAR`, 350, curY);
    curY += 15;
    doc.text(`ضريبة القيمة المضافة (${inv.vatRate || 15}%): ${vatAmount.toFixed(2)} SAR`, 350, curY);
    curY += 15;
    doc.fontSize(12).fillColor('#101C32');
    doc.text(`الإجمالي النهائي: ${total.toFixed(2)} SAR`, 350, curY, { bold: true });

    doc.fontSize(9).fillColor('#888888').text('تم إنشاء هذه الفاتورة عبر منصة أصول لإدارة الثروة والديون', 40, 780, { align: 'center' });
    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
