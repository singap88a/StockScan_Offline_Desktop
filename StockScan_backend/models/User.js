const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'StockScan_Local_Fallback_Secret_2026';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'يرجى إضافة الاسم'],
  },
  email: {
    type: String,
    required: [true, 'يرجى إضافة البريد الإلكتروني'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'يرجى إضافة بريد إلكتروني صحيح',
    ],
  },
  password: {
    type: String,
    required: [true, 'يرجى إضافة كلمة المرور'],
    minlength: 3,
    select: true, // In this app we often need it for simplicity, but usually it's false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'cashier'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return (Static version)
UserSchema.statics.getSignedJwtToken = function (user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Match password (Static version)
UserSchema.statics.matchPassword = async function (enteredPassword, hashedPassword) {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};

// Static method for password hashing
UserSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};


// Backwards compatibility for the custom adapter methods if any are used directly
// Mongoose already provides: find, findOne, findById, create, findByIdAndUpdate, deleteOne, deleteMany, countDocuments

module.exports = mongoose.model('User', UserSchema);

