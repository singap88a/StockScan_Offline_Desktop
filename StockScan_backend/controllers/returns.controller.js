const asyncHandler = require('express-async-handler');
const Return = require('../models/Return');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');

// @desc    Get all returns
// @route   GET /api/returns
// @access  Private
const getReturns = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  let returns = await Return.find({});
  const total = returns.length;

  // Sort by date desc + paginate
  returns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const skip = (Number(page) - 1) * Number(limit);
  const paged = returns.slice(skip, skip + Number(limit));

  res.status(200).json({ success: true, count: paged.length, total, data: paged });
});

// @desc    Get today's return stats
// @route   GET /api/returns/today-stats
// @access  Private
const getTodayReturnStats = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  let returns = await Return.find({});
  returns = returns.filter(r => {
    const d = new Date(r.createdAt);
    return d >= startOfDay && d <= endOfDay;
  });

  const totalRefund = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  res.status(200).json({ success: true, data: { count: returns.length, totalRefund } });
});

// @desc    Process a return
// @route   POST /api/returns
// @access  Private
const createReturn = asyncHandler(async (req, res) => {
  const { invoiceNumber, productId, quantity, reason } = req.body;

  if (!invoiceNumber || !quantity || !reason) {
    res.status(400);
    throw new Error('يرجى تعبئة جميع الحقول المطلوبة');
  }

  const invoice = await Invoice.findOne({ invoiceNumber });
  if (!invoice) {
    res.status(404);
    throw new Error('الفاتورة غير موجودة برقم: ' + invoiceNumber);
  }

  // Find item in invoice
  let targetItem;
  if (productId) {
    targetItem = invoice.items.find(item => item.product === productId || String(item.product) === String(productId));
  } else {
    targetItem = invoice.items[0];
  }

  if (!targetItem) {
    res.status(404);
    throw new Error('المنتج غير موجود في هذه الفاتورة');
  }

  if (quantity > targetItem.quantity) {
    res.status(400);
    throw new Error(`الكمية المطلوبة تتجاوز الكمية في الفاتورة (${targetItem.quantity})`);
  }

  const itemSubtotal = (targetItem.unitPrice || targetItem.price || 0) * quantity;
  const invoiceSubtotal = invoice.subtotal || invoice.items.reduce((s, i) => s + ((i.unitPrice || i.price || 0) * i.quantity), 0) || 1; 
  const proportion = itemSubtotal / invoiceSubtotal;
  const apportionedDiscount = (invoice.discount || 0) * proportion;
  const refundAmount = itemSubtotal - apportionedDiscount;
  
  // Robust cost fetching: check invoice item first, then fallback to Product model
  let costPerUnit = targetItem.costPrice || 0;
  if (!costPerUnit && targetItem.product) {
    const p = await Product.findById(targetItem.product);
    costPerUnit = p?.costPrice || p?.cost || 0;
  }
  const totalCost = costPerUnit * quantity;

  const returnRecord = await Return.create({
    invoice: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    product: targetItem.product,
    productName: targetItem.name,
    quantity,
    reason,
    refundAmount,
    totalCost,
    processedBy: req.user._id,
    processedByName: req.user.name,
    status: 'approved',
  });

  // Re-stock the product
  if (targetItem.product) {
    await Product.findByIdAndUpdate(targetItem.product, { $inc: { quantity: quantity } });
  }

  // Update invoice status to 'returned'
  await Invoice.findByIdAndUpdate(invoice._id, { status: 'returned' });

  res.status(201).json({ success: true, data: returnRecord });
});

// @desc    Delete/Undo a return
// @route   DELETE /api/returns/:id
// @access  Private/Admin
const deleteReturn = asyncHandler(async (req, res) => {
  const returnRecord = await Return.findById(req.params.id);
  if (!returnRecord) {
    res.status(404);
    throw new Error('عملية المرتجع غير موجودة');
  }

  // Reverse stock (it was incremented, now we decrement)
  if (returnRecord.product) {
    await Product.findByIdAndUpdate(returnRecord.product, { $inc: { quantity: -returnRecord.quantity } });
  }

  // Restore invoice status if it was 'returned'
  if (returnRecord.invoice) {
    const invoice = await Invoice.findById(returnRecord.invoice);
    if (invoice && invoice.status === 'returned') {
      await Invoice.findByIdAndUpdate(invoice._id, { status: 'paid' });
    }
  }

  await Return.deleteOne(returnRecord._id);
  res.status(200).json({ success: true, message: 'تم حذف عملية المرتجع وتصحيح المخزون' });
});

module.exports = { getReturns, createReturn, getTodayReturnStats, deleteReturn };
