const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');
const Folder = require('../models/Folder');
const Set = require('../models/Set');
const Flashcard = require('../models/Flashcard');
const LearningProgress = require('../models/LearningProgress');

// List all folders
router.get('/', ensureAuthenticated, checkMFA, (req, res) => {
  const folders = Folder.findByUserId(req.user.id);
  res.render('folders/index', {
    title: 'My Folders',
    user: req.user,
    folders
  });
});

// Create folder page
router.get('/create', ensureAuthenticated, checkMFA, (req, res) => {
  res.render('folders/create', {
    title: 'Create Folder',
    user: req.user
  });
});

// Create folder POST
router.post('/create', ensureAuthenticated, checkMFA, (req, res) => {
  const { name, description } = req.body;
  Folder.create(req.user.id, name, description);
  res.redirect('/folders');
});

// View folder
router.get('/:id', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  const sets = Folder.getSetsInFolder(req.params.id);
  const flashcards = Folder.getFlashcardsInFolder(req.params.id);
  const stats = LearningProgress.getProgressStats(req.user.id);

  res.render('folders/view', {
    title: folder.name,
    user: req.user,
    folder,
    sets,
    flashcards,
    stats
  });
});

// Edit folder page
router.get('/:id/edit', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  res.render('folders/edit', {
    title: 'Edit Folder',
    user: req.user,
    folder
  });
});

// Edit folder POST
router.post('/:id/edit', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  const { name, description } = req.body;
  Folder.update(req.params.id, name, description);
  res.redirect(`/folders/${req.params.id}`);
});

// Delete folder
router.post('/:id/delete', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  Folder.delete(req.params.id);
  res.redirect('/folders');
});

// Study folder (long-term learning)
router.get('/:id/study', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  const dueFlashcards = LearningProgress.getDueFlashcardsInFolder(req.user.id, req.params.id);

  res.render('study/session', {
    title: `Study: ${folder.name}`,
    user: req.user,
    flashcards: dueFlashcards,
    studyType: 'long_term',
    entityType: 'folder',
    entityId: req.params.id
  });
});

// Random study folder
router.get('/:id/random', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  const type = req.query.type || 'all'; // 'all' or 'starred'
  let flashcards;

  if (type === 'starred') {
    flashcards = Flashcard.getStarredByFolderId(req.params.id);
  } else {
    flashcards = Folder.getFlashcardsInFolder(req.params.id);
  }

  // Shuffle flashcards
  flashcards.sort(() => Math.random() - 0.5);

  res.render('study/session', {
    title: `Random Study: ${folder.name}`,
    user: req.user,
    flashcards,
    studyType: type === 'starred' ? 'random_starred' : 'random_all',
    entityType: 'folder',
    entityId: req.params.id
  });
});

module.exports = router;
