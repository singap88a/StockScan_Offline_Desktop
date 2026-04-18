const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  getTodayStats,
  updateInvoice,
  deleteInvoice,
} = require('../controllers/invoices.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.get('/today-stats', protect, getTodayStats);

router.route('/')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route('/:id')
  .get(protect, getInvoice)
  .put(protect, requireAdmin, updateInvoice)
  .delete(protect, requireAdmin, deleteInvoice);

module.exports = router;
