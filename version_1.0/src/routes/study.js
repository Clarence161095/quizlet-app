const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');
const LearningProgress = require('../models/LearningProgress');

// Submit answer
router.post('/answer', ensureAuthenticated, checkMFA, (req, res) => {
  const { flashcard_id, is_correct } = req.body;
  
  LearningProgress.createOrUpdate(req.user.id, flashcard_id, is_correct === 'true' || is_correct === true);
  
  res.json({ success: true });
});

module.exports = router;
