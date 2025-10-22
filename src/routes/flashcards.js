const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');
const Flashcard = require('../models/Flashcard');
const UserNote = require('../models/UserNote');
const Set = require('../models/Set');

// Create flashcard page
router.get('/create/:setId', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.setId);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  res.render('flashcards/create', {
    title: 'Create Flashcard',
    user: req.user,
    set
  });
});

// Create flashcard POST
router.post('/create/:setId', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.setId);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const { word, definition } = req.body;
  Flashcard.create(req.params.setId, word, definition);
  res.redirect(`/sets/${req.params.setId}`);
});

// Edit flashcard page
router.get('/:id/edit', ensureAuthenticated, checkMFA, (req, res) => {
  const flashcard = Flashcard.findById(req.params.id);
  
  if (!flashcard) {
    return res.status(404).send('Flashcard not found');
  }

  const set = Set.findById(flashcard.set_id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Unauthorized');
  }

  const userNote = UserNote.findByUserAndFlashcard(req.user.id, req.params.id);

  res.render('flashcards/edit', {
    title: 'Edit Flashcard',
    user: req.user,
    flashcard,
    set,
    userNote
  });
});

// Edit flashcard POST
router.post('/:id/edit', ensureAuthenticated, checkMFA, (req, res) => {
  const flashcard = Flashcard.findById(req.params.id);
  
  if (!flashcard) {
    return res.status(404).send('Flashcard not found');
  }

  const set = Set.findById(flashcard.set_id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Unauthorized');
  }

  const { word, definition, is_starred, note } = req.body;
  Flashcard.update(req.params.id, word, definition, is_starred ? 1 : 0);

  // Save user note
  if (note && note.trim()) {
    UserNote.createOrUpdate(req.user.id, req.params.id, note);
  } else {
    UserNote.delete(req.user.id, req.params.id);
  }

  res.redirect(`/sets/${flashcard.set_id}`);
});

// Toggle star
router.post('/:id/toggle-star', ensureAuthenticated, checkMFA, (req, res) => {
  const flashcard = Flashcard.findById(req.params.id);
  
  if (!flashcard) {
    return res.status(404).json({ error: 'Flashcard not found' });
  }

  const set = Set.findById(flashcard.set_id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Unauthorized' });
  }

  Flashcard.toggleStar(req.params.id);
  res.json({ success: true });
});

// Delete flashcard
router.post('/:id/delete', ensureAuthenticated, checkMFA, (req, res) => {
  const flashcard = Flashcard.findById(req.params.id);
  
  if (!flashcard) {
    return res.status(404).send('Flashcard not found');
  }

  const set = Set.findById(flashcard.set_id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Unauthorized');
  }

  const setId = flashcard.set_id;
  Flashcard.delete(req.params.id);
  res.redirect(`/sets/${setId}`);
});

module.exports = router;
