const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Return = require('../models/Return');
const User = require('../models/User');
const Expense = require('../models/Expense');

// ─── Helper: filter invoices in memory ───────────────────────────────────────
const filterInvoices = (invoices, { gte, lte, excludeStatus } = {}) => {
  return invoices.filter(inv => {
    const d = new Date(inv.createdAt);
    if (gte && d < gte) return false;
    if (lte && d > lte) return false;
    if (excludeStatus && inv.status === excludeStatus) return false;
    return true;
  });
};

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const startOfDay    = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay      = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const startOfYest   = new Date(startOfDay); startOfYest.setDate(startOfYest.getDate() - 1);
  const endOfYest     = new Date(endOfDay);   endOfYest.setDate(endOfYest.getDate() - 1);
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLast   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLast     = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [allInvoices, allReturns, allExpenses] = await Promise.all([
    Invoice.find({}),
    Return.find({}),
    Expense.find({})
  ]);

  const sum = (arr, field) => arr.reduce((s, item) => s + (item[field] || 0), 0);
  const filterByDate = (arr, gte, lte) => arr.filter(x => {
    const d = new Date(x.createdAt);
    if (gte && d < gte) return false;
    if (lte && d > lte) return false;
    return true;
  });

  // String-based "Today" comparison for maximum reliability in offline/desktop environments
  const d_now = new Date();
  const todayStr = `${d_now.getFullYear()}-${String(d_now.getMonth() + 1).padStart(2, '0')}-${String(d_now.getDate()).padStart(2, '0')}`;
  const isToday = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === todayStr;
  };

  // Invoice Filters
  const todayInvoices = allInvoices.filter(inv => isToday(inv.createdAt) && inv.status !== 'cancelled');
  const yesterdayInvoices = filterByDate(allInvoices, startOfYest, endOfYest).filter(inv => inv.status !== 'cancelled');
  const thisMonthInvoices = filterByDate(allInvoices, startOfMonth).filter(inv => inv.status !== 'cancelled');
  const lastMonthInvoices = filterByDate(allInvoices, startOfLast, endOfLast).filter(inv => inv.status !== 'cancelled');

  // Return Filters
  const todayReturns = allReturns.filter(r => isToday(r.createdAt));
  const yestReturns = filterByDate(allReturns, startOfYest, endOfYest);
  const thisMonthReturns = filterByDate(allReturns, startOfMonth);
  const lastMonthReturns = filterByDate(allReturns, startOfLast, endOfLast);

  // Expense Filters
  const todayExpenses = allExpenses.filter(e => isToday(e.createdAt));
  const totalExpensesAmt = sum(allExpenses, 'amount');
  const todayExpensesAmt = sum(todayExpenses, 'amount');

  // Calculate Net Sales (Sales - Returns)
  const todayGrossSales = sum(todayInvoices, 'total');
  const todayRefunds    = sum(todayReturns, 'refundAmount');
  const todaySales      = (todayGrossSales - todayRefunds) - todayExpensesAmt; // Subtract expenses from net sales too
  
  // Calculate Net Profit
  // Gross Profit = Gross Sales - Gross Cost
  const grossProfit = (sum(todayInvoices, 'total') - sum(todayInvoices, 'totalCost'));
  // Refund Profit Lost = Refund Amount - Refunded Items Cost
  const refundProfitLost = sum(todayReturns, 'refundAmount') - sum(todayReturns, 'totalCost');
  const todayProfit = (grossProfit - refundProfitLost) - todayExpensesAmt; // Deduct from profit as well
  
  const yesterdaySales = sum(yesterdayInvoices, 'total') - sum(yestReturns, 'refundAmount');
  const monthlySales  = sum(thisMonthInvoices, 'total') - sum(thisMonthReturns, 'refundAmount');
  const lastMonthSales = sum(lastMonthInvoices, 'total') - sum(lastMonthReturns, 'refundAmount');
  
  const monthlyProfit = (sum(thisMonthInvoices, 'total') - sum(thisMonthInvoices, 'totalCost')) - (sum(thisMonthReturns, 'refundAmount') - sum(thisMonthReturns, 'totalCost'));

  const trend = (cur, prev) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  const [totalProducts, lowStockItems, totalUsers] = await Promise.all([
    Product.countDocuments({}),
    (async () => { const p = await Product.find({}); return p.filter(x => (x.quantity || 0) <= 5).length; })(),
    User.countDocuments({}),
  ]);

  const totalStoreSales = sum(allInvoices, 'total') - totalExpensesAmt; // Deduct all expenses from total store sales
  const totalCumulativeProfit = (sum(allInvoices, 'total') - sum(allInvoices, 'totalCost')) - (sum(allReturns, 'refundAmount') - sum(allReturns, 'totalCost')) - totalExpensesAmt;

  res.status(200).json({
    success: true,
    data: {
      totalProducts, lowStockItems, totalUsers,
      totalStoreSales: Math.round(totalStoreSales),
      todaySales: Math.max(0, todayGrossSales), // Show Gross first
      todayNetSales: Math.max(0, todaySales),
      todayProfit: Math.max(0, todayProfit), 
      todayTrend: trend(todaySales, yesterdaySales),
      monthlySales: Math.max(0, monthlySales), 
      monthlyProfit: Math.max(0, monthlyProfit), 
      monthTrend: trend(monthlySales, lastMonthSales),
      totalCumulativeProfit: Math.max(0, totalCumulativeProfit),
      todayInvoicesCount: todayInvoices.length,
      todayReturnsCount: todayReturns.length,
      todayRefunds: todayRefunds,
      totalInvoicesCount: allInvoices.length,
      totalExpensesAmt: totalExpensesAmt,
    },
  });
});

// @desc    Get weekly sales chart data
// @route   GET /api/dashboard/weekly-sales
// @access  Private
const getWeeklySales = asyncHandler(async (req, res) => {
  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const [allInvoices, allReturns] = await Promise.all([Invoice.find({}), Return.find({})]);
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const dayInvoices = allInvoices.filter(inv => {
      const idate = new Date(inv.createdAt);
      const invDateStr = `${idate.getFullYear()}-${String(idate.getMonth() + 1).padStart(2, '0')}-${String(idate.getDate()).padStart(2, '0')}`;
      return invDateStr === dayStr && inv.status !== 'cancelled';
    });
    const dayReturns = allReturns.filter(r => {
      const rdate = new Date(r.createdAt);
      const retDateStr = `${rdate.getFullYear()}-${String(rdate.getMonth() + 1).padStart(2, '0')}-${String(rdate.getDate()).padStart(2, '0')}`;
      return retDateStr === dayStr;
    });

    const netSales = dayInvoices.reduce((s, inv) => s + (inv.total || 0), 0) - dayReturns.reduce((s, r) => s + (r.refundAmount || 0), 0);
    
    days.push({ name: arabicDays[date.getDay()], sales: Math.round(Math.max(0, netSales)), count: dayInvoices.length });
  }

  res.status(200).json({ success: true, data: days });
});

// @desc    Get monthly sales (6 months)
// @route   GET /api/dashboard/monthly-sales
// @access  Private
const getMonthlySales = asyncHandler(async (req, res) => {
  const arabicMonths = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const [allInvoices, allReturns] = await Promise.all([Invoice.find({}), Return.find({})]);
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end   = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const monthInvoices = allInvoices.filter(inv => {
      const d = new Date(inv.createdAt);
      return d >= start && d <= end && inv.status !== 'cancelled';
    });
    const monthReturns = allReturns.filter(r => {
      const d = new Date(r.createdAt);
      return d >= start && d <= end;
    });

    const netSales = monthInvoices.reduce((s, inv) => s + (inv.total || 0), 0) - monthReturns.reduce((s, r) => s + (r.refundAmount || 0), 0);
    
    months.push({ name: arabicMonths[date.getMonth()], total: Math.round(Math.max(0, netSales)) });
  }

  res.status(200).json({ success: true, data: months });
});

// @desc    Get category breakdown
// @route   GET /api/dashboard/category-sales
// @access  Private
const getCategorySales = asyncHandler(async (req, res) => {
  const allInvoices = await Invoice.find({});
  const allProducts = await Product.find({});
  const productMap = Object.fromEntries(allProducts.map(p => [p._id, p]));

  const categoryMap = {};
  for (const invoice of allInvoices) {
    if (invoice.status === 'cancelled') continue;
    for (const item of (invoice.items || [])) {
      const product = productMap[item.product];
      const cat = product?.category || 'عام';
      categoryMap[cat] = (categoryMap[cat] || 0) + (item.total || 0);
    }
  }

  const data = Object.entries(categoryMap).map(([name, value]) => ({ name, value: Math.round(value) }));
  res.status(200).json({ success: true, data });
});

// @desc    Get top selling products
// @route   GET /api/dashboard/top-products
// @access  Private
const getTopProducts = asyncHandler(async (req, res) => {
  const allInvoices = await Invoice.find({ status: { $ne: 'cancelled' } });
  const productSales = {};

  for (const invoice of allInvoices) {
    for (const item of (invoice.items || [])) {
      const key = item.product || item.name;
      if (!productSales[key]) {
        productSales[key] = { name: item.name, totalSold: 0, revenue: 0 };
      }
      productSales[key].totalSold += (item.quantity || 0);
      productSales[key].revenue  += (item.total || 0);
    }
  }

  const data = Object.values(productSales)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  res.status(200).json({ success: true, data });
});

// @desc    Get daily financial breakdown
// @route   GET /api/dashboard/daily-stats
// @access  Private
const getDailyStats = asyncHandler(async (req, res) => {
  const [allInvoices, allReturns] = await Promise.all([
    Invoice.find({ status: { $ne: 'cancelled' } }),
    Return.find({})
  ]);

  const dailyMap = {};

  // Process Invoices
  allInvoices.forEach(inv => {
    const d = new Date(inv.createdAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { date: dateKey, sales: 0, cost: 0, count: 0, refundAmount: 0, refundCost: 0, profit: 0 };
    }
    
    dailyMap[dateKey].sales += (inv.total || 0);
    dailyMap[dateKey].cost  += (inv.totalCost || 0);
    dailyMap[dateKey].count += 1;
  });

  // Process Returns
  allReturns.forEach(ret => {
    const d = new Date(ret.createdAt);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { date: dateKey, sales: 0, cost: 0, count: 0, refundAmount: 0, refundCost: 0, profit: 0 };
    }
    
    dailyMap[dateKey].refundAmount += (ret.refundAmount || 0);
    dailyMap[dateKey].refundCost   += (ret.totalCost || 0);
  });

  // Calculate Net Profit for each day
  const result = Object.values(dailyMap).map(day => {
    const netSales = day.sales - day.refundAmount;
    const grossProfit = day.sales - day.cost;
    const refundProfitLost = day.refundAmount - day.refundCost;
    const netProfit = grossProfit - refundProfitLost;

    return {
      date: day.date,
      count: day.count,
      sales: Math.round(Math.max(0, netSales)),
      profit: Math.round(Math.max(0, netProfit))
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  res.status(200).json({ success: true, data: result });
});

module.exports = { getDashboardStats, getWeeklySales, getMonthlySales, getCategorySales, getTopProducts, getDailyStats };
