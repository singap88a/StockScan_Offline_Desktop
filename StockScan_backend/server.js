// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config({ path: require('path').join(__dirname, '.env') });
  } catch (error) {
    console.log('Skipping dotenv in production/missing file');
  }
}
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const User = require('./models/User');

// Initialize MongoDB
connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'file://'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const ensureDefaultUsers = async () => {
  const usersCount = await User.countDocuments();
  if (usersCount > 0) {
    return;
  }

  const defaults = [
    { name: 'مسؤول النظام', email: 'admin@stockscan.com', password: '456', role: 'admin', isActive: true },
    { name: 'كاشير المبيعات', email: 'cashier@stockscan.com', password: '123', role: 'cashier', isActive: true },
  ];

  for (const userData of defaults) {
    await User.create(userData);
    console.log(`✅ Default user created: ${userData.email}`);
  }
};

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Frontend Setup ─────────────────────────────────────────────────────────────
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../StockScan_frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/products',  require('./routes/products.routes'));
app.use('/api/invoices',  require('./routes/invoices.routes'));
app.use('/api/returns',   require('./routes/returns.routes'));
app.use('/api/users',     require('./routes/users.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/expenses',  require('./routes/expense.routes'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: '🚀 StockScan API is running', timestamp: new Date().toISOString() });
});

// ─── 404 Handler / Catch-All for React Router ─────────────────────────────────
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({ success: false, message: `المسار ${req.originalUrl} غير موجود` });
  } else {
    // Return frontend if it exists, otherwise just return a success message (for Vercel API-only deployments)
    if (fs.existsSync(path.join(frontendDistPath, 'index.html'))) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(200).send(`StockScan Backend API is online. Environment: ${process.env.NODE_ENV}`);
    }
  }
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'خطأ داخلي في السيرفر',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  await ensureDefaultUsers();

  server = app.listen(PORT, () => {
    console.log(`\n🚀 StockScan Online Server running on port ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start StockScan backend:', error);
  process.exit(1);
});

// ─── Process Management ───────────────────────────────────────────────────────
// Auto-exit if the parent process (Electron) disconnects or kills this process
process.on('disconnect', () => {
  console.log('🔌 Parent process disconnected. Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
