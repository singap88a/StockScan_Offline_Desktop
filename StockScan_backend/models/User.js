const { db } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'StockScan_Local_Fallback_Secret_2026';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

// SQLite Adapter for User
const User = {
  find: async (query = {}) => {
    let sql = 'SELECT * FROM users';
    const params = [];
    const keys = Object.keys(query);
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...Object.values(query));
    }
    return db.prepare(sql).all(...params);
  },

  findOne: async (query) => {
    let sql = 'SELECT * FROM users';
    const params = [];
    const keys = Object.keys(query);
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...Object.values(query));
    }
    return db.prepare(sql).get(...params);
  },

  findById: async (id) => {
    return db.prepare('SELECT * FROM users WHERE _id = ?').get(id);
  },

  create: async (dataOrArray) => {
    const processOne = async (data) => {
      const _id = data._id || randomUUID();
      const name = data.name;
      const email = data.email ? data.email.toLowerCase().trim() : null;
      let password = data.password;
      
      if (password) {
        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);
      }
      
      const role = data.role || 'user';
      const isActive = data.isActive === undefined ? 1 : (data.isActive ? 1 : 0);
      const createdAt = data.createdAt || new Date().toISOString();

      const stmt = db.prepare(`
        INSERT INTO users (_id, name, email, password, role, isActive, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(_id, name, email, password, role, isActive, createdAt);
      return db.prepare('SELECT * FROM users WHERE _id = ?').get(_id);
    };

    if (Array.isArray(dataOrArray)) {
      const results = [];
      for (const item of dataOrArray) {
        results.push(await processOne(item));
      }
      return results;
    }
    return processOne(dataOrArray);
  },

  findByIdAndUpdate: async (id, update) => {
    const fields = update.$set || update;
    const sets = [];
    const params = [];

    for (const key in fields) {
      if (key === 'isActive') {
        sets.push(`${key} = ?`);
        params.push(fields[key] ? 1 : 0);
      } else {
        sets.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (sets.length > 0) {
      params.push(id);
      db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE _id = ?`).run(...params);
    }
    return db.prepare('SELECT * FROM users WHERE _id = ?').get(id);
  },

  deleteOne: async (id) => {
    return db.prepare('DELETE FROM users WHERE _id = ?').run(id);
  },

  deleteMany: async (query = {}) => {
    if (Object.keys(query).length === 0) {
      return db.prepare('DELETE FROM users').run();
    }
    // Specific query delete could be added
  },

  countDocuments: async (query = {}) => {
    const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return row.count;
  },

  // ─── Static Auth Helpers ────────────────────────────────────────────────────
  matchPassword: async (enteredPassword, hashedPassword) => {
    return bcrypt.compare(enteredPassword, hashedPassword);
  },
  getSignedJwtToken: (user) => {
    return jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );
  },
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },
};

module.exports = User;
