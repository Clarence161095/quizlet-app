const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');

// Login page
router.get('/login', (req, res) => {
  res.render('auth/login', { 
    message: req.flash('error'),
    title: 'Login'
  });
});

// Login POST
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/auth/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      // Check if MFA is enabled - require verification
      if (user.mfa_enabled) {
        // Clear any previous MFA verification
        req.session.mfaVerified = false;
        return res.redirect('/auth/mfa-verify');
      }
      
      // For users without MFA, check if it's admin's first login
      // Only force MFA setup for admin users
      if (user.is_admin && !user.mfa_enabled) {
        return res.redirect('/auth/mfa-setup?force=1');
      }
      
      // Regular users without MFA can proceed
      // But set first_login to 0 to avoid repeated prompts
      if (user.first_login) {
        User.update(user.id, { first_login: 0 });
      }

      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

// MFA Setup page (for admin)
router.get('/mfa-setup', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }

  const isForced = req.query.force === '1';
  const secret = speakeasy.generateSecret({
    name: `QiApp-${req.user.username}`
  });

  req.session.tempMfaSecret = secret.base32;

  QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error generating QR code');
    }

    res.render('auth/mfa-setup', {
      title: 'MFA Setup',
      qrCode: dataUrl,
      secret: secret.base32,
      isForced: isForced
    });
  });
});

// MFA Setup POST
router.post('/mfa-setup', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }

  const { token } = req.body;
  const secret = req.session.tempMfaSecret;

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

    req.flash('success', 'MFA enabled successfully!');
    return res.redirect('/dashboard');
  } else {
    req.flash('error', 'Invalid token. Please try again.');
    return res.redirect('/auth/mfa-setup');
  }
});

// MFA Verify page
router.get('/mfa-verify', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }

  res.render('auth/mfa-verify', {
    title: 'MFA Verification',
    message: req.flash('error')
  });
});

// MFA Verify POST
router.post('/mfa-verify', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }

  const { token } = req.body;

  const verified = speakeasy.totp.verify({
    secret: req.user.mfa_secret,
    encoding: 'base32',
    token: token
  });

  if (verified) {
    req.session.mfaVerified = true;
    return res.redirect('/dashboard');
  } else {
    req.flash('error', 'Invalid token. Please try again.');
    return res.redirect('/auth/mfa-verify');
  }
});

// Change password page
router.get('/change-password', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }

  const isForced = req.query.force === '1';

  res.render('auth/change-password', {
    title: 'Change Password',
    message: req.flash('error'),
    success: req.flash('success'),
    isForced: isForced
  });
});

// Change password POST
router.post('/change-password', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;
  const isForced = req.user.must_change_password;

  // Skip current password check if forced change (first login)
  if (!isForced) {
    const isMatch = await bcrypt.compare(currentPassword, req.user.password);
    if (!isMatch) {
      req.flash('error', 'Current password is incorrect');
      return res.redirect('/auth/change-password');
    }
  }

  if (newPassword !== confirmPassword) {
    req.flash('error', 'New passwords do not match');
    return res.redirect('/auth/change-password' + (isForced ? '?force=1' : ''));
  }

  if (newPassword.length < 6) {
    req.flash('error', 'Password must be at least 6 characters long');
    return res.redirect('/auth/change-password' + (isForced ? '?force=1' : ''));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  User.update(req.user.id, { 
    password: hashedPassword,
    must_change_password: 0
  });

  // Update session user object
  req.user.must_change_password = 0;

  req.flash('success', 'Password changed successfully!');
  
  // Redirect to MFA setup if first login
  if (req.user.first_login) {
    return res.redirect('/auth/mfa-setup?force=1');
  }
  
  res.redirect('/dashboard');
});

// ─── Forgot Password (via MFA) ────────────────────────────────────────────────

// Step 1: Enter username
router.get('/forgot-password', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    message: req.flash('error'),
    success: req.flash('success')
  });
});

router.post('/forgot-password', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');

  const { username } = req.body;
  const user = User.findByUsername(username);

  if (!user) {
    req.flash('error', 'No account found with that username.');
    return res.redirect('/auth/forgot-password');
  }

  if (!user.mfa_enabled || !user.mfa_secret) {
    req.flash('error', 'This account does not have MFA enabled. Please contact an administrator to reset your password.');
    return res.redirect('/auth/forgot-password');
  }

  // Store username in session for next steps
  req.session.forgotPasswordUsername = user.username;
  req.session.forgotPasswordMfaVerified = false;
  return res.redirect('/auth/forgot-password/mfa');
});

// Step 2: MFA verification
router.get('/forgot-password/mfa', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  if (!req.session.forgotPasswordUsername) return res.redirect('/auth/forgot-password');

  res.render('auth/forgot-password-mfa', {
    title: 'Verify Identity',
    message: req.flash('error')
  });
});

router.post('/forgot-password/mfa', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  if (!req.session.forgotPasswordUsername) return res.redirect('/auth/forgot-password');

  const { token } = req.body;
  const user = User.findByUsername(req.session.forgotPasswordUsername);

  if (!user) {
    delete req.session.forgotPasswordUsername;
    req.flash('error', 'Session expired. Please start over.');
    return res.redirect('/auth/forgot-password');
  }

  const verified = speakeasy.totp.verify({
    secret: user.mfa_secret,
    encoding: 'base32',
    token: token,
    window: 1
  });

  if (!verified) {
    req.flash('error', 'Invalid MFA code. Please try again.');
    return res.redirect('/auth/forgot-password/mfa');
  }

  req.session.forgotPasswordMfaVerified = true;
  return res.redirect('/auth/forgot-password/reset');
});

// Step 3: Set new password
router.get('/forgot-password/reset', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  if (!req.session.forgotPasswordUsername || !req.session.forgotPasswordMfaVerified) {
    return res.redirect('/auth/forgot-password');
  }

  res.render('auth/forgot-password-reset', {
    title: 'Set New Password',
    message: req.flash('error')
  });
});

router.post('/forgot-password/reset', async (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  if (!req.session.forgotPasswordUsername || !req.session.forgotPasswordMfaVerified) {
    return res.redirect('/auth/forgot-password');
  }

  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/auth/forgot-password/reset');
  }

  if (newPassword.length < 6) {
    req.flash('error', 'Password must be at least 6 characters.');
    return res.redirect('/auth/forgot-password/reset');
  }

  const user = User.findByUsername(req.session.forgotPasswordUsername);
  if (!user) {
    req.flash('error', 'Session expired. Please start over.');
    delete req.session.forgotPasswordUsername;
    delete req.session.forgotPasswordMfaVerified;
    return res.redirect('/auth/forgot-password');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  User.update(user.id, { password: hashedPassword });

  // Clean up session
  delete req.session.forgotPasswordUsername;
  delete req.session.forgotPasswordMfaVerified;

  req.flash('success', 'Password reset successfully! Please log in.');
  return res.redirect('/auth/login');
});

// ──────────────────────────────────────────────────────────────────────────────

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    // Clear MFA verification from session
    req.session.mfaVerified = false;
    delete req.session.mfaVerified;
    delete req.session.tempMfaSecret;
    
    // Destroy session completely for security
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.redirect('/auth/login');
    });
  });
});

module.exports = router;
