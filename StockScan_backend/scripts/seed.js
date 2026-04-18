require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting offline seed...\n');

  // Clear old data
  const { db } = require('../config/db');
  await db.users.remove({}, { multi: true });
  await db.products.remove({}, { multi: true });
  await db.invoices.remove({}, { multi: true });
  await db.returns.remove({}, { multi: true });
  console.log('🗑️  Cleared existing local data');

  // ─── Users ────────────────────────────────────────────────────────────────
  const usersToCreate = [
    { name: 'مسؤول النظام', email: 'admin@stockscan.com', password: '456', role: 'admin', isActive: true },
    { name: 'كاشير المبيعات', email: 'cashier@stockscan.com', password: '123', role: 'cashier', isActive: true },
    { name: 'أحمد علي', email: 'ahmed@stockscan.com', password: '123', role: 'cashier', isActive: true },
    { name: 'سارة محمد', email: 'sara@stockscan.com', password: '123', role: 'cashier', isActive: true }
  ];
  const users = [];
  for (const u of usersToCreate) {
    users.push(await User.create(u));
  }
  console.log(`✅ Created ${users.length} users`);

  // ─── Products ─────────────────────────────────────────────────────────────
  const productsToCreate = [
    { name: 'قميص أبيض قطني', barcode: '123456789', sellPrice: 250, costPrice: 150, quantity: 45, color: 'أبيض', size: 'XL', discount: 10, category: 'ملابس' },
    { name: 'بنطال جينز أزرق', barcode: '987654321', sellPrice: 400, costPrice: 200, quantity: 5, color: 'أزرق', size: '34', discount: 0, category: 'ملابس' },
    { name: 'حذاء رياضي أسود', barcode: '456789123', sellPrice: 600, costPrice: 350, quantity: 12, color: 'أسود', size: '42', discount: 50, category: 'أحذية' },
    { name: 'ساعة يد ذكية', barcode: '789123456', sellPrice: 1200, costPrice: 800, quantity: 20, color: 'فضي', size: 'وسط', discount: 100, category: 'إلكترونيات' },
    { name: 'نظارة شمسية', barcode: '321654987', sellPrice: 300, costPrice: 120, quantity: 2, color: 'أسود', size: 'موحد', discount: 0, category: 'إكسسوارات' },
    { name: 'حقيبة جلد بني', barcode: '111222333', sellPrice: 850, costPrice: 450, quantity: 8, color: 'بني', size: 'كبير', discount: 0, category: 'إكسسوارات' },
    { name: 'كنزة صوف رمادية', barcode: '444555666', sellPrice: 320, costPrice: 180, quantity: 30, color: 'رمادي', size: 'L', discount: 20, category: 'ملابس' },
    { name: 'حذاء جلد رسمي', barcode: '777888999', sellPrice: 750, costPrice: 400, quantity: 4, color: 'بني', size: '43', discount: 0, category: 'أحذية' }
  ];
  const products = await Product.create(productsToCreate);
  console.log(`✅ Created ${products.length} products`);

  // ─── Invoices ─────────────────────────────────────────────────────────────
  const adminUser = users[0];
  const cashier1 = users[2];
  const cashier2 = users[3];

  await Invoice.create({
    customer: 'عميل نقدي',
    customerPhone: '01012345678',
    invoiceNumber: 'INV-001',
    items: [
      {
        product: products[0]._id,
        name: products[0].name,
        quantity: 1,
        unitPrice: 240,
        costPrice: products[0].costPrice,
        discount: 10,
        total: 240,
      },
    ],
    subtotal: 240,
    totalCost: products[0].costPrice * 1,
    discount: 0,
    tax: 33.6,
    total: 273.6,
    paymentMethod: 'cash',
    status: 'paid',
    cashier: cashier1._id,
    cashierName: cashier1.name,
    createdAt: new Date()
  });

  await Invoice.create({
    customer: 'محمد محمود',
    customerPhone: '01198765432',
    invoiceNumber: 'INV-002',
    items: [
      {
        product: products[1]._id,
        name: products[1].name,
        quantity: 2,
        unitPrice: 400,
        costPrice: products[1].costPrice,
        discount: 0,
        total: 800,
      },
      {
        product: products[2]._id,
        name: products[2].name,
        quantity: 1,
        unitPrice: 550,
        costPrice: products[2].costPrice,
        discount: 50,
        total: 550,
      },
    ],
    subtotal: 1350,
    totalCost: products[1].costPrice * 2 + products[2].costPrice * 1,
    discount: 0,
    tax: 189,
    total: 1539,
    paymentMethod: 'card',
    status: 'paid',
    cashier: cashier2._id,
    cashierName: cashier2.name,
    createdAt: new Date()
  });

  console.log(`✅ Created 2 sample invoices`);

  console.log('\n🎉 Offline Seed completed successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('  Admin   → admin@stockscan.com  / password: 456');
  console.log('  Cashier → cashier@stockscan.com / password: 123\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
