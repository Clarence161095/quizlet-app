// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
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
  checkMFA
};
