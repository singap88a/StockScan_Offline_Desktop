const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  // Remove passwords from response
  const safeUsers = users.map(({ password: _, ...u }) => u);
  res.status(200).json({ success: true, count: safeUsers.length, data: safeUsers });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('المستخدم غير موجود');
  }
  const { password: _, ...safeUser } = user;
  res.status(200).json({ success: true, data: safeUser });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    res.status(400);
    throw new Error('هذا البريد الإلكتروني مسجل بالفعل');
  }

  const user = await User.create({ name, email, password, role });
  const { password: _, ...safeUser } = user;
  res.status(201).json({ success: true, data: safeUser });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('المستخدم غير موجود');
  }

  // Build $set object
  const updates = {};
  ['name', 'email', 'role', 'isActive'].forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // Hash password if being updated
  if (req.body.password) {
    updates.password = await User.hashPassword(req.body.password);
  }

  const updated = await User.findByIdAndUpdate(user._id, { $set: updates });
  const { password: _, ...safeUser } = updated;
  res.status(200).json({ success: true, data: safeUser });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('المستخدم غير موجود');
  }

  if (user._id === req.user._id) {
    res.status(400);
    throw new Error('لا يمكنك حذف حسابك الخاص');
  }

  await User.deleteOne(user._id);
  res.status(200).json({ success: true, message: 'تم حذف المستخدم بنجاح' });
});

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
