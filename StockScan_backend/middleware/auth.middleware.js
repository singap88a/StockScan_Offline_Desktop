const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('غير مصرح — يرجى تسجيل الدخول أولاً');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'StockScan_Local_Fallback_Secret_2026');
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      res.status(401);
      throw new Error('المستخدم غير موجود');
    }
// //////////
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Token غير صالح أو منتهي الصلاحية');
  }
});

module.exports = { protect };
