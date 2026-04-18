const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'يرجى إضافة اسم المنتج'],
    trim: true,
  },
  barcode: {
    type: String,
    required: [true, 'يرجى إضافة باركود المنتج'],
    unique: true,
    trim: true,
  },
  sellPrice: {
    type: Number,
    required: [true, 'يرجى إضافة سعر البيع'],
    default: 0,
  },
  costPrice: {
    type: Number,
    required: [true, 'يرجى إضافة سعر التكلفة'],
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  quantity: {
    type: Number,
    required: [true, 'يرجى إضافة الكمية'],
    default: 0,
  },
  category: {
    type: String,
    default: 'عام',
  },
  image: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for backwards compatibility with 'price' and 'cost'
ProductSchema.virtual('price').get(function() {
  return this.sellPrice;
}).set(function(val) {
  this.sellPrice = val;
});

ProductSchema.virtual('cost').get(function() {
  return this.costPrice;
}).set(function(val) {
  this.costPrice = val;
});

module.exports = mongoose.model('Product', ProductSchema);

