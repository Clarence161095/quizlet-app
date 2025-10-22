// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

// Middleware to check if user must change password on first login
function checkPasswordChange(req, res, next) {
  if (req.user && req.user.must_change_password) {
    // Allow access to change password page and logout
    const allowedPaths = ['/auth/change-password', '/auth/logout'];
    if (!allowedPaths.includes(req.path)) {
      return res.redirect('/auth/change-password?force=1');
    }
  }
  next();
}

// Middleware to check if user needs to setup MFA on first login
function checkFirstLogin(req, res, next) {
  if (req.user && req.user.first_login && !req.user.must_change_password) {
    // Allow access to MFA setup page and logout
    const allowedPaths = ['/auth/mfa-setup', '/auth/logout', '/auth/mfa-verify'];
    if (!allowedPaths.includes(req.path)) {
      return res.redirect('/auth/mfa-setup?force=1');
    }
  }
  next();
}

// Middleware to check if user is admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.is_admin) {
    return next();
  }
  res.status(403).send('Access denied. Admin only.');
}

// Middleware to check MFA if enabled
function checkMFA(req, res, next) {
  if (req.user && req.user.mfa_enabled && !req.session.mfaVerified) {
    return res.redirect('/auth/mfa-verify');
  }
  next();
}

module.exports = {
  ensureAuthenticated,
  ensureAdmin,
  checkMFA,
  checkPasswordChange,
  checkFirstLogin
};
