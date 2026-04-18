const { db } = require('../config/db');
const { randomUUID } = require('crypto');

// SQLite Adapter for Product
const Product = {
  find: async (query = {}) => {
    let sql = 'SELECT *, sellPrice as price, costPrice as cost FROM products';
    const params = [];
    const keys = Object.keys(query).filter(k => typeof query[k] !== 'object');
    
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...keys.map(k => query[k]));
    }
    
    // Handle specific operators if needed (like $lte for low stock)
    if (query.quantity && typeof query.quantity === 'object') {
       if (query.quantity.$lte !== undefined) {
         sql += (keys.length > 0 ? ' AND ' : ' WHERE ') + 'quantity <= ?';
         params.push(query.quantity.$lte);
       }
    }

    sql += ' ORDER BY createdAt DESC';
    return db.prepare(sql).all(...params);
  },
  
  findOne: async (query) => {
    let sql = 'SELECT *, sellPrice as price, costPrice as cost FROM products';
    const params = [];
    const keys = Object.keys(query);
    
    if (keys.length > 0) {
      sql += ' WHERE ' + keys.map(k => `${k} = ?`).join(' AND ');
      params.push(...Object.values(query));
    }
    
    return db.prepare(sql).get(...params);
  },
  
  findById: async (id) => {
    return db.prepare('SELECT *, sellPrice as price, costPrice as cost FROM products WHERE _id = ?').get(id);
  },
  
  create: async (data) => {
    const _id = data._id || randomUUID();
    const createdAt = data.createdAt || new Date().toISOString();
    const discount = data.discount === undefined ? 0 : data.discount;
    const quantity = data.quantity === undefined ? 0 : data.quantity;
    const category = data.category || 'عام';

    const stmt = db.prepare(`
      INSERT INTO products (_id, name, barcode, sellPrice, costPrice, discount, quantity, category, image, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      _id,
      data.name,
      data.barcode,
      data.sellPrice || data.price || 0,
      data.costPrice || data.cost || 0,
      discount,
      quantity,
      category,
      data.image,
      createdAt
    );

    return db.prepare('SELECT *, sellPrice as price, costPrice as cost FROM products WHERE _id = ?').get(_id);
  },
  
  findByIdAndUpdate: async (id, update) => {
    const setClause = [];
    const params = [];
    
    const fields = update.$set || update;
    
    // Convert NeDB field names to SQL field names if necessary
    const fieldMapping = {
      price: 'sellPrice',
      cost: 'costPrice'
    };

    Object.keys(fields).forEach(key => {
      if (key !== '$inc' && key !== '$set') {
        const sqlKey = fieldMapping[key] || key;
        setClause.push(`${sqlKey} = ?`);
        params.push(fields[key]);
      }
    });
    
    if (setClause.length > 0) {
      const setParams = [...params, id];
      db.prepare(`UPDATE products SET ${setClause.join(', ')} WHERE _id = ?`).run(...setParams);
    }

    if (update.$inc) {
      Object.keys(update.$inc).forEach(key => {
        const sqlKey = fieldMapping[key] || key;
        const val = update.$inc[key];
        db.prepare(`UPDATE products SET ${sqlKey} = ${sqlKey} + ? WHERE _id = ?`).run(val, id);
      });
    }
    
    return db.prepare('SELECT *, sellPrice as price, costPrice as cost FROM products WHERE _id = ?').get(id);
  },
  
  deleteOne: async (id) => {
    return db.prepare('DELETE FROM products WHERE _id = ?').run(id);
  },
  
  deleteMany: async (query = {}) => {
    // Simple implementation for truncate/mass delete
    if (Object.keys(query).length === 0) {
      return db.prepare('DELETE FROM products').run();
    }
    // Specific query delete could be added if needed
  },
  
  countDocuments: async (query = {}) => {
    const row = db.prepare('SELECT COUNT(*) as count FROM products').get();
    return row.count;
  },
  
  distinct: async (field, query = {}) => {
    const rows = db.prepare(`SELECT DISTINCT ${field} FROM products`).all();
    return rows.map(r => r[field]).filter(v => v != null);
  },
};

module.exports = Product;
