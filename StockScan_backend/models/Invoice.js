const { db } = require('../config/db');
const { randomUUID } = require('crypto');

// Helper to safely parse JSON
const parseJSON = (str) => {
  try {
    return (str && str.trim()) ? JSON.parse(str) : [];
  } catch (e) {
    return [];
  }
};

// SQLite Adapter for Invoice
const Invoice = {
  find: async (query = {}) => {
    let sql = 'SELECT *, total as totalAmount, customer as customerName FROM invoices';
    const params = [];
    
    // Simple filter support
    const keys = Object.keys(query).filter(k => typeof query[k] !== 'object');
    
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...keys.map(k => query[k]));
    }
    
    // Handle $ne status if present in NeDB style { status: { $ne: 'cancelled' } }
    if (query.status && typeof query.status === 'object' && query.status.$ne) {
       sql += (params.length > 0 ? ' AND ' : ' WHERE ') + 'status != ?';
       params.push(query.status.$ne);
    }

    sql += ' ORDER BY createdAt DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => ({ ...r, items: parseJSON(r.items) }));
  },

  findOne: async (query) => {
    let sql = 'SELECT *, total as totalAmount, customer as customerName FROM invoices';
    const params = [];
    const keys = Object.keys(query);
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...Object.values(query));
    }
    const row = db.prepare(sql).get(...params);
    if (row) row.items = parseJSON(row.items);
    return row;
  },

  findById: async (id) => {
    const row = db.prepare('SELECT *, total as totalAmount, customer as customerName FROM invoices WHERE _id = ?').get(id);
    if (row) row.items = parseJSON(row.items);
    return row;
  },

  create: async (data) => {
    const _id = data._id || randomUUID();
    const invoiceNumber = data.invoiceNumber || 'INV-' + Date.now().toString().slice(-8);
    const createdAt = data.createdAt || new Date().toISOString();
    const items = JSON.stringify(data.items || []);

    const stmt = db.prepare(`
      INSERT INTO invoices (
        _id, invoiceNumber, customer, customerPhone, 
        subtotal, totalCost, discount, tax, total, 
        paymentMethod, status, cashier, cashierName, 
        items, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      _id,
      invoiceNumber,
      data.customer || data.customerName || 'عميل نقدي',
      data.customerPhone || '',
      data.subtotal || 0,
      data.totalCost || 0,
      data.discount || 0,
      data.tax || 0,
      data.total || data.totalAmount || 0,
      data.paymentMethod || 'cash',
      data.status || 'paid',
      data.cashier,
      data.cashierName,
      items,
      createdAt
    );

    const result = db.prepare('SELECT *, total as totalAmount, customer as customerName FROM invoices WHERE _id = ?').get(_id);
    if (result) result.items = parseJSON(result.items);
    return result;
  },

  findByIdAndUpdate: async (id, update) => {
    const fields = update.$set || update;
    const sets = [];
    const params = [];

    const fieldMapping = {
      customerName: 'customer',
      totalAmount: 'total'
    };

    for (const key in fields) {
      if (key === '$set' || key === '$inc') continue;
      
      const sqlKey = fieldMapping[key] || key;
      if (key === 'items' && typeof fields[key] !== 'string') {
        sets.push(`${sqlKey} = ?`);
        params.push(JSON.stringify(fields[key]));
      } else {
        sets.push(`${sqlKey} = ?`);
        params.push(fields[key]);
      }
    }

    if (sets.length > 0) {
      params.push(id);
      db.prepare(`UPDATE invoices SET ${sets.join(', ')} WHERE _id = ?`).run(...params);
    }
    
    const result = db.prepare('SELECT *, total as totalAmount, customer as customerName FROM invoices WHERE _id = ?').get(id);
    if (result) result.items = parseJSON(result.items);
    return result;
  },

  deleteOne: async (id) => {
    return db.prepare('DELETE FROM invoices WHERE _id = ?').run(id);
  },

  countDocuments: async (query = {}) => {
    const row = db.prepare('SELECT COUNT(*) as count FROM invoices').get();
    return row.count;
  },
};

module.exports = Invoice;
