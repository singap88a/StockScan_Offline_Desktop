const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'يرجى إضافة رقم الفاتورة'],
    unique: true,
    default: function() {
      return 'INV-' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
    }
  },

  customer: {
    type: String,
    default: 'عميل نقدي',
  },
  customerPhone: {
    type: String,
    default: '',
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  totalCost: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer'],
    default: 'cash',
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'cancelled'],
    default: 'paid',
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cashierName: {
    type: String,
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    barcode: String,
    sellPrice: Number,
    price: Number,
    unitPrice: Number,
    costPrice: Number,
    cost: Number,
    quantity: Number,
    discount: Number,
    total: Number,
  }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for backwards compatibility
InvoiceSchema.virtual('customerName').get(function() {
  return this.customer;
}).set(function(val) {
  this.customer = val;
});

InvoiceSchema.virtual('totalAmount').get(function() {
  return this.total;
}).set(function(val) {
  this.total = val;
});

module.exports = mongoose.model('Invoice', InvoiceSchema);

