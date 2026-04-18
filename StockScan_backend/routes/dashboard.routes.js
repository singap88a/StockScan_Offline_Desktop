const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getWeeklySales,
  getMonthlySales,
  getCategorySales,
  getTopProducts,
  getDailyStats,
} = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.get('/stats', protect, requireAdmin, getDashboardStats);
router.get('/weekly-sales', protect, requireAdmin, getWeeklySales);
router.get('/monthly-sales', protect, requireAdmin, getMonthlySales);
router.get('/category-sales', protect, requireAdmin, getCategorySales);
router.get('/top-products', protect, requireAdmin, getTopProducts);
router.get('/daily-stats', protect, requireAdmin, getDailyStats);

module.exports = router;
