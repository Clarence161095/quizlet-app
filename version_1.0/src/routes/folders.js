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
  const stats = LearningProgress.getProgressStatsForFolder(req.user.id, req.params.id);

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
  
  // Get ALL flashcards for stats calculation (not just due ones)
  const allFlashcards = Folder.getFlashcardsInFolder(req.params.id);
  
  // Mark due cards with progress
  dueFlashcards.forEach(card => {
    card.has_progress = card.next_review_date !== null && card.next_review_date !== undefined;
  });
  
  // Add progress info to all flashcards for accurate stats
  allFlashcards.forEach(card => {
    const progress = LearningProgress.findByUserAndFlashcard(req.user.id, card.id);
    if (progress) {
      card.has_progress = true;
      card.consecutive_correct = progress.consecutive_correct || 0;
      card.is_mastered = progress.is_mastered || 0;
    } else {
      card.has_progress = false;
      card.consecutive_correct = 0;
      card.is_mastered = 0;
    }
  });

  res.render('study/session', {
    title: `Study: ${folder.name}`,
    user: req.user,
    flashcards: dueFlashcards,
    allFlashcards: allFlashcards, // Pass all flashcards for stats
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
  
  // Fetch learning progress for each flashcard
  flashcards.forEach(card => {
    const progress = LearningProgress.findByUserAndFlashcard(req.user.id, card.id);
    if (progress) {
      card.has_progress = true;
      card.consecutive_correct = progress.consecutive_correct || 0;
      card.next_review_date = progress.next_review_date;
      card.is_mastered = progress.is_mastered || 0;
    } else {
      card.has_progress = false;
      card.consecutive_correct = 0;
      card.is_mastered = 0;
    }
  });

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

// Manage sets in folder page
router.get('/:id/manage-sets', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  const currentSets = Folder.getSetsInFolder(req.params.id);
  const currentSetIds = currentSets.map(s => s.id);
  
  // Get all user's sets that are NOT in this folder
  const allSets = Set.findByUserId(req.user.id);
  const availableSets = allSets.filter(s => !currentSetIds.includes(s.id));

  res.render('folders/manage-sets', {
    title: `Manage Sets: ${folder.name}`,
    user: req.user,
    folder,
    currentSets,
    availableSets
  });
});

// Add set to folder
router.post('/:id/add-set', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  const { setId } = req.body;
  const set = Set.findById(setId);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  Folder.addSetToFolder(req.params.id, setId);
  req.flash('success', `Set "${set.name}" added to folder`);
  res.redirect(`/folders/${req.params.id}/manage-sets`);
});

// Remove set from folder
router.post('/:folderId/remove-set/:setId', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.folderId);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(404).send('Folder not found');
  }

  Folder.removeSetFromFolder(req.params.folderId, req.params.setId);
  req.flash('success', 'Set removed from folder');
  res.redirect(`/folders/${req.params.folderId}/manage-sets`);
});

module.exports = router;
