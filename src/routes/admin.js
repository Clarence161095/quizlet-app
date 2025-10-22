const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { ensureAuthenticated, ensureAdmin, checkMFA } = require('../middleware/auth');
const User = require('../models/User');

// Admin dashboard
router.get('/', ensureAuthenticated, checkMFA, ensureAdmin, (req, res) => {
  const users = User.getAll();
  res.render('admin/index', {
    title: 'Admin Dashboard',
    user: req.user,
    users
  });
});

// Create user page
router.get('/users/create', ensureAuthenticated, checkMFA, ensureAdmin, (req, res) => {
  res.render('admin/create-user', {
    title: 'Create User',
    user: req.user
  });
});

// Create user POST
router.post('/users/create', ensureAuthenticated, checkMFA, ensureAdmin, async (req, res) => {
  const { username, password, email, is_admin } = req.body;

  if (User.findByUsername(username)) {
    req.flash('error', 'Username already exists');
    return res.redirect('/admin/users/create');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  User.create(username, hashedPassword, email, is_admin ? 1 : 0);

  req.flash('success', `User ${username} created successfully!`);
  res.redirect('/admin');
});

// Toggle user active status
router.post('/users/:id/toggle-active', ensureAuthenticated, checkMFA, ensureAdmin, (req, res) => {
  const user = User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).send('User not found');
  }

  User.update(req.params.id, { is_active: user.is_active ? 0 : 1 });
  res.redirect('/admin');
});

// Delete user
router.post('/users/:id/delete', ensureAuthenticated, checkMFA, ensureAdmin, (req, res) => {
  if (req.params.id == req.user.id) {
    return res.status(400).send('Cannot delete yourself');
  }

  User.delete(req.params.id);
  res.redirect('/admin');
});

// Reset user password
router.post('/users/:id/reset-password', ensureAuthenticated, checkMFA, ensureAdmin, async (req, res) => {
  const { newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).send('Password must be at least 6 characters');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  User.update(req.params.id, { password: hashedPassword });

  req.flash('success', 'Password reset successfully!');
  res.redirect('/admin');
});

module.exports = router;
