const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private/Admin
const getExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({});
  res.status(200).json({ success: true, data: expenses });
});

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private/Admin
const createExpense = asyncHandler(async (req, res) => {
  const { title, personName, amount, details, phone } = req.body;

  if (!title || !amount) {
    res.status(400);
    throw new Error('يرجى إدخال عنوان المصروف والمبلغ');
  }

  const expense = await Expense.create({
    title,
    personName,
    amount,
    details,
    phone,
  });

  res.status(201).json({ success: true, data: expense });
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.deleteOne(req.params.id);
  res.status(200).json({ success: true, message: 'تم حذف المصروف بنجاح' });
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private/Admin
const updateExpense = asyncHandler(async (req, res) => {
  const { title, personName, amount, details, phone } = req.body;

  const updatedExpense = await Expense.updateOne(req.params.id, {
    title,
    personName,
    amount,
    details,
    phone,
  });

  res.status(200).json({ success: true, data: updatedExpense });
});

module.exports = { getExpenses, createExpense, deleteExpense, updateExpense };
