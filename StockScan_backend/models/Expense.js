const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'يرجى إضافة عنوان المصروف'],
  },
  personName: {
    type: String,
    default: '',
  },
  amount: {
    type: Number,
    required: [true, 'يرجى إضافة المبلغ'],
    default: 0,
  },
  details: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Expense', ExpenseSchema);

