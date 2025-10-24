require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./routes/auth');
const setsRoutes = require('./routes/sets');
const foldersRoutes = require('./routes/folders');
const flashcardsRoutes = require('./routes/flashcards');
const studyRoutes = require('./routes/study');
const sharesRoutes = require('./routes/shares');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Qi Learning App API'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sets', setsRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/shares', sharesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════╗
║   Qi Learning App API Server v2.0    ║
║                                       ║
║   Server running on port ${PORT}       ║
║   Environment: ${process.env.NODE_ENV || 'development'}          ║
║                                       ║
║   Ready to accept connections         ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
