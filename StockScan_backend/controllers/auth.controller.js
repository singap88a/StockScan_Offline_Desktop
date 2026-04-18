const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    res.status(401);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  const isMatch = await User.matchPassword(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('هذا الحساب موقوف. تواصل مع المسؤول.');
  }

  const token = User.getSignedJwtToken(user);

  res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { password: _, ...safeUser } = user;
  res.status(200).json({ success: true, data: safeUser });
});

module.exports = { login, getMe };
