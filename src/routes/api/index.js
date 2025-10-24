const express = require('express');
const router = express.Router();

// Import API routes
const authRoutes = require('./auth');

// Mount routes
router.use('/auth', authRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
