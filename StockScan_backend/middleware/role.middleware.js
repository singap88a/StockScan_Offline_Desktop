const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403);
  throw new Error('هذا الإجراء يتطلب صلاحيات المسؤول (Admin)');
};

const requireCashierOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'cashier'].includes(req.user.role)) {
    return next();
  }
  res.status(403);
  throw new Error('غير مصرح بهذا الإجراء');
};

module.exports = { requireAdmin, requireCashierOrAdmin };
