const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWorkspaces,
  createWorkspace,
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  addAssetExpense,
  getWallets,
  createWallet,
  getPeople,
  createPerson,
  deletePerson,
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  addDebtPayment,
  getStock,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  recordStockMovement,
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF
} = require('../controllers/appController');

// حماية كل الروابط بـ JWT protect
router.use(protect);

// مساحات العمل
router.route('/workspaces').get(getWorkspaces).post(createWorkspace);

// الأصول
router.route('/workspaces/:wsId/assets').get(getAssets).post(createAsset);
router.route('/assets/:id').put(updateAsset).delete(deleteAsset);
router.route('/assets/:id/expenses').post(addAssetExpense);

// محافظ
router.route('/workspaces/:wsId/wallets').get(getWallets).post(createWallet);

// الأشخاص والديون
router.route('/workspaces/:wsId/people').get(getPeople).post(createPerson);
router.route('/people/:id').delete(deletePerson);
router.route('/workspaces/:wsId/debts').get(getDebts).post(createDebt);
router.route('/debts/:id').put(updateDebt).delete(deleteDebt);
router.route('/debts/:id/payments').post(addDebtPayment);

// المستودع
router.route('/workspaces/:wsId/stock').get(getStock).post(createStockItem);
router.route('/stock/:id').put(updateStockItem).delete(deleteStockItem);
router.route('/workspaces/:wsId/stock/movement').post(recordStockMovement);

// الفواتير و PDF
router.route('/workspaces/:wsId/invoices').get(getInvoices).post(createInvoice);
router.route('/invoices/:id').put(updateInvoice).delete(deleteInvoice);
router.route('/invoices/:id/pdf').get(downloadInvoicePDF);

module.exports = router;
