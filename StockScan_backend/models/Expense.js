const { db } = require('../config/db');
const { randomUUID } = require('crypto');

// SQLite Adapter for Expense
const Expense = {
  // Initialize table if not exists
  init: () => {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS expenses (
        _id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        personName TEXT,
        amount REAL NOT NULL,
        details TEXT,
        phone TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  },

  find: async (query = {}) => {
    let sql = 'SELECT * FROM expenses';
    const params = [];
    const keys = Object.keys(query).filter(k => typeof query[k] !== 'object');
    
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...keys.map(k => query[k]));
    }

    sql += ' ORDER BY createdAt DESC';
    return db.prepare(sql).all(...params);
  },

  create: async (data) => {
    const _id = randomUUID();
    const createdAt = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO expenses (_id, title, personName, amount, details, phone, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      _id,
      data.title,
      data.personName || '',
      data.amount || 0,
      data.details || '',
      data.phone || '',
      createdAt
    );

    return db.prepare('SELECT * FROM expenses WHERE _id = ?').get(_id);
  },

  deleteOne: async (id) => {
    return db.prepare('DELETE FROM expenses WHERE _id = ?').run(id);
  },

  updateOne: async (id, data) => {
    const stmt = db.prepare(`
      UPDATE expenses 
      SET title = ?, personName = ?, amount = ?, details = ?, phone = ?
      WHERE _id = ?
    `);
    stmt.run(data.title, data.personName, data.amount, data.details, data.phone, id);
    return db.prepare('SELECT * FROM expenses WHERE _id = ?').get(id);
  },

  countDocuments: async () => {
    const row = db.prepare('SELECT COUNT(*) as count FROM expenses').get();
    return row.count;
  }
};

// Auto-init table
Expense.init();

module.exports = Expense;
