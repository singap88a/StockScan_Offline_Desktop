require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
const Return = require('./models/Return');
const Expense = require('./models/Expense');
const Product = require('./models/Product');

const cleanAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Invoice.deleteMany({});
    await Return.deleteMany({});
    await Expense.deleteMany({});
    // Products too? Let's just ask the user or just delete Invoices/Returns/Expenses since they are transactional
    console.log('Cleared Invoices, Returns, and Expenses.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

cleanAll();
