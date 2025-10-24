const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    
    // Remove sensitive data
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      mfa_enabled: user.mfa_enabled,
      created_at: user.created_at
    }));
    
    res.json(safeUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/users
 * Create new user (admin only)
 */
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, email, is_admin } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if username exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = await User.create({
      username,
      password,
      email: email || null,
      is_admin: is_admin || false
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user (admin only)
 */
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, is_admin } = req.body;
    
    const updatedUser = await User.update(req.params.id, {
      email: email !== undefined ? email : user.email,
      is_admin: is_admin !== undefined ? is_admin : user.is_admin
    });

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      is_admin: updatedUser.is_admin
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user (admin only)
 */
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Prevent self-deletion
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.delete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password (admin only)
 */
router.post('/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.updatePassword(req.params.id, newPassword);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
