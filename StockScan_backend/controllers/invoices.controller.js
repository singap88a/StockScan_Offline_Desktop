const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const User = require('../models/User');
const Return = require('../models/Return');

// ─── Helper: manually attach cashier name ─────────────────────────────────────
const attachCashier = async (invoice) => {
  if (!invoice || !invoice.cashier) return invoice;
  const cashier = await User.findById(invoice.cashier);
  return { ...invoice, cashierInfo: cashier ? { name: cashier.name, email: cashier.email } : null };
};

// ─── Helper: sort + paginate in-memory ───────────────────────────────────────
const sortAndPage = (docs, sort = 'createdAt', page = 1, limit = 50) => {
  const sorted = [...docs].sort((a, b) => new Date(b[sort]) - new Date(a[sort]));
  const skip = (Number(page) - 1) * Number(limit);
  return sorted.slice(skip, skip + Number(limit));
};

// ─── Match a NeDB query manually ──────────────────────────────────────────────
const matchDocs = async (query = {}) => {
  const allInvoices = await Invoice.find({});
  return allInvoices.filter(inv => {
    if (query.status && inv.status !== query.status) return false;
    if (query['status.$ne'] && inv.status === query['status.$ne']) return false;
    if (query.cashier && inv.cashier !== query.cashier) return false;
    if (query.createdAt) {
      const d = new Date(inv.createdAt);
      if (query.createdAt.$gte && d < query.createdAt.$gte) return false;
      if (query.createdAt.$lte && d > query.createdAt.$lte) return false;
    }
    if (query.$or) {
      const match = query.$or.some(cond => {
        return Object.entries(cond).every(([key, val]) => {
          if (val.$regex) return new RegExp(val.$regex, val.$options || '').test(inv[key] || '');
          return inv[key] === val;
        });
      });
      if (!match) return false;
    }
    return true;
  });
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  const { search, status, cashierId, page = 1, limit = 50 } = req.query;

  let invoices = await Invoice.find({});

  // Filter by status
  if (status) {
    invoices = invoices.filter(inv => inv.status === status);
  } else {
    // Default: Hide returned and cancelled invoices from the main list
    invoices = invoices.filter(inv => inv.status !== 'returned' && inv.status !== 'cancelled');
  }

  // RBAC
  if (req.user.role !== 'admin') {
    invoices = invoices.filter(inv => inv.cashier === req.user._id);
  } else if (cashierId) {
    invoices = invoices.filter(inv => inv.cashier === cashierId);
  }

  // Search
  if (search) {
    const re = new RegExp(search, 'i');
    invoices = invoices.filter(inv =>
      re.test(inv.invoiceNumber) || re.test(inv.customer) || re.test(inv.customerPhone)
    );
  }

  const total = invoices.length;

  // Sort by date desc + paginate
  invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const skip = (Number(page) - 1) * Number(limit);
  const paged = invoices.slice(skip, skip + Number(limit));

  res.status(200).json({
    success: true,
    count: paged.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: paged,
  });
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('الفاتورة غير موجودة');
  }
  res.status(200).json({ success: true, data: invoice });
});

// @desc    Update invoice (Admin only)
// @route   PUT /api/invoices/:id
// @access  Private/Admin
const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('الفاتورة غير موجودة');
  }

  const updates = {};
  ['customer', 'customerPhone', 'status', 'paymentMethod'].forEach(f => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const updated = await Invoice.findByIdAndUpdate(invoice._id, { $set: updates });
  res.status(200).json({ success: true, data: updated });
});

// @desc    Delete invoice (Restock & Delete)
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('الفاتورة غير موجودة');
  }

  // Restock items before deleting
  for (const item of invoice.items || []) {
    if (item.product) {
      await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    }
  }

  await Invoice.deleteOne(invoice._id);
  res.status(200).json({ success: true, message: 'تم حذف الفاتورة وإعادة البضاعة للمخزن' });
});

// @desc    Create invoice & decrement product quantities
// @route   POST /api/invoices
// @access  Private
const createInvoice = asyncHandler(async (req, res) => {
  const { items, customer, customerPhone, paymentMethod, discount, cashierId, cashierName } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('يجب إضافة منتج واحد على الأقل');
  }

  let subtotal = 0;
  let totalCost = 0;
  const processedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`المنتج غير موجود: ${item.name}`);
    }
    if (product.quantity < item.quantity) {
      res.status(400);
      throw new Error(`الكمية المتوفرة من "${product.name}" هي ${product.quantity} فقط`);
    }

    const unitPrice = (product.sellPrice || product.price || 0) - (product.discount || 0);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;
    totalCost += ((product.costPrice || product.cost || 0) * item.quantity);

    processedItems.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      costPrice: product.costPrice || product.cost || 0,
      discount: product.discount || 0,
      total: itemTotal,
    });

    // Decrement stock
    await Product.findByIdAndUpdate(product._id, { $inc: { quantity: -item.quantity } });
  }

  const discountAmount = Number(discount) || 0;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * 0.14;
  const total = taxableAmount + tax;

  const invoice = await Invoice.create({
    customer: customer || 'عميل نقدي',
    customerPhone: customerPhone || '',
    items: processedItems,
    subtotal,
    totalCost,
    discount: discountAmount,
    tax,
    total,
    paymentMethod: paymentMethod || 'cash',
    status: 'paid',
    cashier: cashierId || req.user._id,
    cashierName: cashierName || req.user.name,
  });

  res.status(201).json({ success: true, data: invoice });
});

// @desc    Get today's invoice stats
// @route   GET /api/invoices/today-stats
// @access  Private
const getTodayStats = asyncHandler(async (req, res) => {
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [allInvoices, allReturns] = await Promise.all([
    Invoice.find({}),
    Return.find({})
  ]);

  let todayInvoices = allInvoices.filter(inv => {
    const idate = new Date(inv.createdAt);
    const invDateStr = `${idate.getFullYear()}-${String(idate.getMonth() + 1).padStart(2, '0')}-${String(idate.getDate()).padStart(2, '0')}`;
    return invDateStr === todayStr && inv.status !== 'cancelled';
  });

  const todayReturns = allReturns.filter(r => {
    const rdate = new Date(r.createdAt);
    const retDateStr = `${rdate.getFullYear()}-${String(rdate.getMonth() + 1).padStart(2, '0')}-${String(rdate.getDate()).padStart(2, '0')}`;
    return retDateStr === todayStr;
  });

  if (req.user.role !== 'admin') {
    todayInvoices = todayInvoices.filter(inv => inv.cashier === req.user._id);
    // Note: Returns filtering by cashier could be added if Return model track cashier
  }

  const todaySalesTotal = todayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const todayRefundTotal = todayReturns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  
  const netTotal = todaySalesTotal - todayRefundTotal;
  const pendingCount = todayInvoices.filter(inv => inv.status === 'pending').length;

  res.status(200).json({
    success: true,
    data: { 
      count: todayInvoices.length, 
      total: todaySalesTotal, // Display Gross in the main card for immediate feedback
      netTotal: Math.max(0, netTotal), 
      pendingCount,
      refundTotal: todayRefundTotal
    },
  });
});

module.exports = { getInvoices, getInvoice, createInvoice, getTodayStats, updateInvoice, deleteInvoice };
