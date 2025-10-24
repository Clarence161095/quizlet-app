const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      email: email || null,
      is_admin: false
    });

    // Generate JWT token
    const token = generateToken({ id: user.id, username: user.username, is_admin: user.is_admin });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user and verify password
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValid = await User.verifyPassword(user.id, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if user is admin and has MFA enabled
    if (user.is_admin && user.mfa_enabled) {
      // Return flag to redirect to MFA verification
      return res.json({
        requireMFA: true,
        userId: user.id,
        username: user.username
      });
    }

    // Generate JWT token
    const token = generateToken({ 
      id: user.id, 
      username: user.username, 
      is_admin: user.is_admin,
      mfaVerified: !user.mfa_enabled // If MFA is not enabled, consider it verified
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        mfa_enabled: user.mfa_enabled
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

/**
 * POST /api/auth/mfa/setup
 * Setup MFA for user (admin only)
 */
router.post('/mfa/setup', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.is_admin) {
      return res.status(403).json({ error: 'MFA is only available for admin users' });
    }

    // Generate MFA secret
    const secret = speakeasy.generateSecret({
      name: `Qi Learning App (${user.username})`,
      length: 32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/mfa/verify-setup
 * Verify and enable MFA
 */
router.post('/mfa/verify-setup', async (req, res) => {
  try {
    const { userId, secret, token } = req.body;

    if (!userId || !secret || !token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable MFA for user
    await User.setupMFA(userId, secret);

    res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('MFA verify setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/mfa/verify
 * Verify MFA token during login
 */
router.post('/mfa/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'User ID and token are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfa_enabled || !user.mfa_secret) {
      return res.status(400).json({ error: 'MFA is not enabled for this user' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Generate JWT token with MFA verified flag
    const jwtToken = generateToken({ 
      id: user.id, 
      username: user.username, 
      is_admin: user.is_admin,
      mfaVerified: true
    });

    // Set httpOnly cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'MFA verification successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        mfa_enabled: user.mfa_enabled
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('MFA verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/mfa/disable
 * Disable MFA
 */
router.post('/mfa/disable', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await User.disableMFA(userId);

    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Verify current password
    const isValid = await User.verifyPassword(userId, currentPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await User.updatePassword(userId, newPassword);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res) => {
  try {
    // This route should be protected by authenticateToken middleware in server.js
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      mfa_enabled: user.mfa_enabled,
      created_at: user.created_at
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
