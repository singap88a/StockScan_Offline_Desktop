const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getCategories,
} = require('../controllers/products.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Special routes first (before /:id)
router.get('/low-stock', protect, getLowStockProducts);
router.get('/categories', protect, getCategories);
router.get('/barcode/:code', protect, getProductByBarcode);

router.route('/')
  .get(protect, getProducts)
  .post(protect, requireAdmin, createProduct);

router.route('/:id')
  .get(protect, getProduct)
  .put(protect, requireAdmin, updateProduct)
  .delete(protect, requireAdmin, deleteProduct);

module.exports = router;
