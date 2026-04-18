const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// @desc    Get all products (with search + pagination)
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 50, category } = req.query;

  let products = await Product.find({});

  if (search) {
    const re = new RegExp(search, 'i');
    products = products.filter(p => re.test(p.name) || re.test(p.barcode));
  }
  if (category) {
    products = products.filter(p => p.category === category);
  }

  const total = products.length;

  // Sort by date desc + paginate
  products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const skip = (Number(page) - 1) * Number(limit);
  const paged = products.slice(skip, skip + Number(limit));

  res.status(200).json({
    success: true,
    count: paged.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: paged,
  });
});

// @desc    Get product by barcode (for scan page)
// @route   GET /api/products/barcode/:code
// @access  Private
const getProductByBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ barcode: req.params.code });
  if (!product) {
    res.status(404);
    throw new Error('لم يتم العثور على منتج بهذا الباركود');
  }
  res.status(200).json({ success: true, data: product });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('المنتج غير موجود');
  }
  res.status(200).json({ success: true, data: product });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('المنتج غير موجود');
  }

  // Build $set from allowed fields
  const updates = {};
  const allowedFields = ['name', 'barcode', 'sellPrice', 'price', 'costPrice', 'cost', 'discount', 'quantity', 'category', 'image'];
  allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const updated = await Product.findByIdAndUpdate(product._id, { $set: updates }, { new: true });
  res.status(200).json({ success: true, data: updated });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('المنتج غير موجود');
  }
  await Product.deleteOne(product._id);
  res.status(200).json({ success: true, message: 'تم حذف المنتج بنجاح' });
});

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
const getLowStockProducts = asyncHandler(async (req, res) => {
  let products = await Product.find({});
  products = products.filter(p => (p.quantity || 0) <= 5);
  products.sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
  res.status(200).json({ success: true, count: products.length, data: products });
});

// @desc    Get unique categories
// @route   GET /api/products/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  const categories = [...new Set(products.map(p => p.category || 'عام').filter(Boolean))];
  res.status(200).json({ success: true, data: categories.length > 0 ? categories : ['عام'] });
});

module.exports = {
  getProducts,
  getProduct,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategories,
};
