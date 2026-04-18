const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, deleteExpense, updateExpense } = require('../controllers/expense.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.use(protect);
router.use(requireAdmin);

router.route('/').get(getExpenses).post(createExpense);
router.route('/:id').delete(deleteExpense).put(updateExpense);

module.exports = router;
