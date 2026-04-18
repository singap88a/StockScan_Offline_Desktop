const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Get Data Directory from main process via environment variable, or use local 'data' folder
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'stockscan.db');
const dbInstance = new Database(dbPath);

// Initialize Tables
const initDB = () => {
  // Users Table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      _id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      isActive INTEGER DEFAULT 1,
      createdAt TEXT
    )
  `);

  // Products Table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS products (
      _id TEXT PRIMARY KEY,
      name TEXT,
      barcode TEXT UNIQUE,
      sellPrice REAL,
      price REAL,
      costPrice REAL,
      cost REAL,
      discount REAL DEFAULT 0,
      quantity REAL DEFAULT 0,
      category TEXT DEFAULT 'عام',
      image TEXT,
      createdAt TEXT
    )
  `);

  // Invoices Table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      _id TEXT PRIMARY KEY,
      invoiceNumber TEXT UNIQUE,
      customer TEXT DEFAULT 'عميل نقدي',
      customerPhone TEXT,
      subtotal REAL DEFAULT 0,
      totalCost REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      paymentMethod TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'paid',
      cashier TEXT,
      cashierName TEXT,
      items TEXT, -- JSON string of items
      createdAt TEXT
    )
  `);

  // Returns Table
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS returns (
      _id TEXT PRIMARY KEY,
      invoice TEXT, -- ID of the invoice
      invoiceNumber TEXT,
      product TEXT, -- ID of the product
      productName TEXT,
      quantity REAL DEFAULT 0,
      refundAmount REAL DEFAULT 0,
      reason TEXT,
      processedBy TEXT, -- ID of the user
      processedByName TEXT,
      status TEXT DEFAULT 'approved',
      createdAt TEXT
    )
  `);

  console.log(`📂 SQLite Database Initialized at: ${dbPath}`);
};

initDB();

const connectDB = async () => {
  return dbInstance;
};

// Exporting a structure similar to before but for SQL
module.exports = { connectDB, db: dbInstance };
