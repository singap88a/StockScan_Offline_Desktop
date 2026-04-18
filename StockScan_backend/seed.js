require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { connectDB } = require('./config/db');
const User = require('./models/User');

const seedData = async () => {
  try {
    await connectDB();
    console.log('📂 NeDB Ready. Starting seed...');

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@stockscan.com' });
    if (existing) {
      console.log('⚠️  Admin user already exists — skipping seed.');
      process.exit(0);
    }

    await User.create([
      {
        name: 'المدير',
        email: 'admin@stockscan.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
      },
      {
        name: 'الكاشير',
        email: 'cashier@stockscan.com',
        password: 'cashier123',
        role: 'cashier',
        isActive: true,
      },
    ]);

    console.log('✅ Default users created!');
    console.log('   Admin:   admin@stockscan.com  /  admin123');
    console.log('   Cashier: cashier@stockscan.com / cashier123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedData();
