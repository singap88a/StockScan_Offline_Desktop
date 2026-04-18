const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/users.controller');
const { protect } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.route('/')
  .get(protect, getUsers)
  .post(protect, requireAdmin, createUser);

router.route('/:id')
  .get(protect, requireAdmin, getUser)
  .put(protect, requireAdmin, updateUser)
  .delete(protect, requireAdmin, deleteUser);

module.exports = router;
