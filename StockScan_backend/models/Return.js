const { db } = require('../config/db');
const { randomUUID } = require('crypto');

// SQLite Adapter for Return
const Return = {
  find: async (query = {}) => {
    let sql = 'SELECT * FROM returns';
    const params = [];
    const keys = Object.keys(query);
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...Object.values(query));
    }
    sql += ' ORDER BY createdAt DESC';
    const rows = db.prepare(sql).all(...params);
    return rows;
  },

  findOne: async (query) => {
    let sql = 'SELECT * FROM returns';
    const params = [];
    const keys = Object.keys(query);
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...Object.values(query));
    }
    return db.prepare(sql).get(...params);
  },

  findById: async (id) => {
    return db.prepare('SELECT * FROM returns WHERE _id = ?').get(id);
  },

  create: async (data) => {
    const _id = data._id || randomUUID();
    const createdAt = data.createdAt || new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO returns (
        _id, invoice, invoiceNumber, product, productName, 
        quantity, refundAmount, totalCost, reason, processedBy, 
        processedByName, status, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      _id,
      data.invoice,
      data.invoiceNumber,
      data.product,
      data.productName,
      data.quantity || 0,
      data.refundAmount || 0,
      data.totalCost || 0,
      data.reason,
      data.processedBy,
      data.processedByName,
      data.status || 'approved',
      createdAt
    );

    return db.prepare('SELECT * FROM returns WHERE _id = ?').get(_id);
  },

  findByIdAndUpdate: async (id, update) => {
    const fields = update.$set || update;
    const sets = [];
    const params = [];

    for (const key in fields) {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    }

    if (sets.length > 0) {
      params.push(id);
      db.prepare(`UPDATE returns SET ${sets.join(', ')} WHERE _id = ?`).run(...params);
    }
    
    return db.prepare('SELECT * FROM returns WHERE _id = ?').get(id);
  },

  deleteOne: async (id) => {
    return db.prepare('DELETE FROM returns WHERE _id = ?').run(id);
  },

  countDocuments: async (query = {}) => {
    const row = db.prepare('SELECT COUNT(*) as count FROM returns').get();
    return row.count;
  },
};

module.exports = Return;
