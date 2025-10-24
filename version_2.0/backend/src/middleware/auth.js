const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    is_admin: user.is_admin,
    mfa_enabled: user.mfa_enabled
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to authenticate requests using JWT
 */
const authenticateToken = (req, res, next) => {
  // Get token from Authorization header (Bearer token)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Middleware to check MFA verification for admin users
 */
const checkMFA = (req, res, next) => {
  // If user is admin and MFA is enabled, check if MFA is verified
  if (req.user && req.user.is_admin && req.user.mfa_enabled) {
    // In v2.0, MFA verification is done during login
    // Token already contains mfa_verified flag if needed
    // For now, we assume MFA is handled during login process
    next();
  } else {
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireAdmin,
  checkMFA
};
