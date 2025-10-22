const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');
const Folder = require('../models/Folder');
const Set = require('../models/Set');

// Dashboard
router.get('/', ensureAuthenticated, checkMFA, (req, res) => {
  const folders = Folder.findByUserId(req.user.id);
  const sets = Set.findByUserId(req.user.id);

  res.render('dashboard/index', {
    title: 'Dashboard',
    user: req.user,
    folders,
    sets
  });
});

module.exports = router;
