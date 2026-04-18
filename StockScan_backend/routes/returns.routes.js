const express = require('express');
const router = express.Router();
const {
  getReturns,
  createReturn,
  getTodayReturnStats,
  deleteReturn,
} = require('../controllers/returns.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/today-stats', protect, getTodayReturnStats);

router.route('/')
  .get(protect, getReturns)
  .post(protect, createReturn);

router.delete('/:id', protect, deleteReturn);

module.exports = router;
