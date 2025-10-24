require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const passport = require('./config/passport');
const { initDB } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', false);
app.set('layout extractStyles', false);

// Middleware
app.use(express.json({ limit: '50mb' })); // Tăng limit cho JSON
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Tăng limit cho form data
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, '../data')
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages middleware
app.use((req, res, next) => {
  req.flash = (type, message) => {
    if (!req.session.flash) req.session.flash = {};
    if (!req.session.flash[type]) req.session.flash[type] = [];
    req.session.flash[type].push(message);
  };
  next();
});

app.use((req, res, next) => {
  res.locals.flash = req.session.flash || {};
  delete req.session.flash;
  next();
});

// Add user info and title to all views
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user;
  res.locals.title = res.locals.title || 'Qi App';
  next();
});

// Import middleware for first login checks
const { checkPasswordChange, checkFirstLogin } = require('./middleware/auth');

// Apply first login checks globally for authenticated users
app.use((req, res, next) => {
  if (req.isAuthenticated()) {
    checkPasswordChange(req, res, () => {
      checkFirstLogin(req, res, next);
    });
  } else {
    next();
  }
});

// API Routes (for React SPA)
app.use('/api', require('./routes/api'));

// Legacy EJS Routes (keep for now during migration)
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.redirect('/auth/login');
});

app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/admin', require('./routes/admin'));
app.use('/folders', require('./routes/folders'));
app.use('/sets', require('./routes/sets'));
app.use('/flashcards', require('./routes/flashcards'));
app.use('/study', require('./routes/study'));
app.use('/shares', require('./routes/shares'));

// Error handling
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Not Found',
    message: 'Page not found',
    user: req.user,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '500 - Server Error',
    message: 'Something went wrong!',
    user: req.user,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ✓ Server is running on port ${PORT}
  ✓ Environment: ${process.env.NODE_ENV || 'development'}
  ✓ Open http://localhost:${PORT} in your browser
  ✓ Default admin credentials: admin / admin123
  `);
});

module.exports = app;
