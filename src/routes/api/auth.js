const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../../models/User');

// Check session - GET /api/auth/session
router.get('/session', (req, res) => {
  if (req.isAuthenticated()) {
    // Check if MFA is required but not verified
    const mfaRequired = req.user.mfa_enabled && !req.session.mfaVerified;
    
    return res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        is_admin: req.user.is_admin,
        mfa_enabled: req.user.mfa_enabled,
        first_login: req.user.first_login,
        must_change_password: req.user.must_change_password
      },
      mfaRequired
    });
  }
  
  res.json({ authenticated: false, user: null });
});

// Login - POST /api/auth/login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: info.message || 'Invalid credentials' });
    }
    
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login error' });
      }
      
      // Check if MFA is enabled - require verification
      if (user.mfa_enabled) {
        req.session.mfaVerified = false;
        return res.json({
          success: true,
          mfaRequired: true,
          message: 'MFA verification required'
        });
      }
      
      // For admin without MFA, force MFA setup
      if (user.is_admin && !user.mfa_enabled) {
        return res.json({
          success: true,
          requireMfaSetup: true,
          message: 'MFA setup required for admin users'
        });
      }
      
      // Regular users without MFA can proceed
      if (user.first_login) {
        User.update(user.id, { first_login: 0 });
      }
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          is_admin: user.is_admin,
          mfa_enabled: user.mfa_enabled
        }
      });
    });
  })(req, res, next);
});

// Logout - POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout error' });
    }
    
    // Clear MFA verification
    req.session.mfaVerified = false;
    delete req.session.mfaVerified;
    delete req.session.tempMfaSecret;
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Session destruction error' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

// MFA Setup - GET /api/auth/mfa-setup
router.get('/mfa-setup', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const secret = speakeasy.generateSecret({
    name: `QiApp-${req.user.username}`
  });
  
  req.session.tempMfaSecret = secret.base32;
  
  QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error generating QR code' });
    }
    
    res.json({
      success: true,
      qrCode: dataUrl,
      secret: secret.base32
    });
  });
});

// MFA Setup - POST /api/auth/mfa-setup
router.post('/mfa-setup', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { token } = req.body;
  const secret = req.session.tempMfaSecret;
  
  if (!secret) {
    return res.status(400).json({ error: 'No MFA setup in progress' });
  }
  
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token
  });
  
  if (verified) {
    User.update(req.user.id, {
      mfa_secret: secret,
      mfa_enabled: 1,
      first_login: 0
    });
    
    req.session.mfaVerified = true;
    delete req.session.tempMfaSecret;
    
    // Update user object in session
    req.user.mfa_enabled = 1;
    req.user.first_login = 0;
    
    return res.json({
      success: true,
      message: 'MFA enabled successfully'
    });
  } else {
    return res.status(400).json({ error: 'Invalid token' });
  }
});

// MFA Verify - POST /api/auth/mfa-verify
router.post('/mfa-verify', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (!req.user.mfa_enabled) {
    return res.status(400).json({ error: 'MFA not enabled for this user' });
  }
  
  const { token } = req.body;
  
  const verified = speakeasy.totp.verify({
    secret: req.user.mfa_secret,
    encoding: 'base32',
    token: token
  });
  
  if (verified) {
    req.session.mfaVerified = true;
    return res.json({
      success: true,
      message: 'MFA verified successfully',
      user: {
        id: req.user.id,
        username: req.user.username,
        is_admin: req.user.is_admin
      }
    });
  } else {
    return res.status(400).json({ error: 'Invalid token' });
  }
});

// Change Password - POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { currentPassword, newPassword } = req.body;
  const isForced = req.user.must_change_password;
  
  // Validate inputs
  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  // Skip current password check if forced change
  if (!isForced) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }
    
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
  }
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    User.update(req.user.id, {
      password: hashedPassword,
      must_change_password: 0
    });
    
    // Update session user object
    req.user.must_change_password = 0;
    
    return res.json({
      success: true,
      message: 'Password changed successfully',
      requireMfaSetup: req.user.first_login && req.user.is_admin && !req.user.mfa_enabled
    });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Error changing password' });
  }
});

module.exports = router;
