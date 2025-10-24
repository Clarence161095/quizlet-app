const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Set = require('../models/Set');
const Folder = require('../models/Folder');
const Flashcard = require('../models/Flashcard');
const LearningProgress = require('../models/LearningProgress');

/**
 * GET /api/study/set/:setId
 * Get study session data for a set (spaced repetition)
 */
router.get('/set/:setId', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.setId);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    const mode = req.query.mode || 'spaced'; // 'spaced' or 'random'
    
    let flashcards;
    
    if (mode === 'spaced') {
      // Spaced repetition - only due cards
      flashcards = await LearningProgress.getDueFlashcards(req.user.id, req.params.setId);
    } else {
      // Random study - all cards with user data
      flashcards = await Flashcard.getAllWithUserData(req.params.setId, req.user.id);
      
      // Shuffle for random study
      for (let i = flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
      }
    }

    const stats = await LearningProgress.getProgressStats(req.user.id, req.params.setId);

    res.json({
      set,
      flashcards,
      stats,
      mode
    });
  } catch (error) {
    console.error('Get study session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/study/folder/:folderId
 * Get study session data for a folder (all sets in folder)
 */
router.get('/folder/:folderId', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.folderId);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const mode = req.query.mode || 'spaced';
    
    let flashcards;
    
    if (mode === 'spaced') {
      // Spaced repetition - only due cards from folder
      flashcards = await LearningProgress.getDueFlashcardsInFolder(req.user.id, req.params.folderId);
    } else {
      // Random study - all cards from all sets in folder
      const sets = await Folder.getSetsInFolder(req.params.folderId);
      flashcards = [];
      
      for (const set of sets) {
        const cards = await Flashcard.getAllWithUserData(set.id, req.user.id);
        flashcards.push(...cards);
      }
      
      // Shuffle for random study
      for (let i = flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
      }
    }

    const stats = await LearningProgress.getProgressStatsForFolder(req.user.id, req.params.folderId);

    res.json({
      folder,
      flashcards,
      stats,
      mode
    });
  } catch (error) {
    console.error('Get folder study session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/study/answer
 * Record study answer and update learning progress
 * CRITICAL: This implements the spaced repetition algorithm
 */
router.post('/answer', authenticateToken, async (req, res) => {
  try {
    const { flashcard_id, is_correct } = req.body;
    
    if (!flashcard_id || is_correct === undefined) {
      return res.status(400).json({ error: 'Flashcard ID and is_correct are required' });
    }

    // Verify flashcard belongs to user
    const flashcard = await Flashcard.findById(flashcard_id);
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const set = await Set.findById(flashcard.set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    // Update learning progress (Modified SM-2 Algorithm)
    const progress = await LearningProgress.createOrUpdate(
      req.user.id, 
      flashcard_id, 
      is_correct
    );

    res.json({
      message: 'Answer recorded successfully',
      progress
    });
  } catch (error) {
    console.error('Record answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/study/reset/:flashcardId
 * Reset learning progress for a flashcard
 */
router.post('/reset/:flashcardId', authenticateToken, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.flashcardId);
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const set = await Set.findById(flashcard.set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    await LearningProgress.resetProgress(req.user.id, req.params.flashcardId);
    
    res.json({ message: 'Learning progress reset successfully' });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/study/stats/set/:setId
 * Get detailed learning statistics for a set
 */
router.get('/stats/set/:setId', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.setId);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    const stats = await LearningProgress.getProgressStats(req.user.id, req.params.setId);
    const dueFlashcards = await LearningProgress.getDueFlashcards(req.user.id, req.params.setId);
    const starredFlashcards = await Flashcard.getStarred(req.params.setId);

    res.json({
      stats,
      dueCount: dueFlashcards.length,
      starredCount: starredFlashcards.length
    });
  } catch (error) {
    console.error('Get study stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/study/stats/folder/:folderId
 * Get detailed learning statistics for a folder
 */
router.get('/stats/folder/:folderId', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.folderId);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const stats = await LearningProgress.getProgressStatsForFolder(req.user.id, req.params.folderId);
    const dueFlashcards = await LearningProgress.getDueFlashcardsInFolder(req.user.id, req.params.folderId);

    res.json({
      stats,
      dueCount: dueFlashcards.length
    });
  } catch (error) {
    console.error('Get folder study stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/study/progress/all
 * Get all learning progress for current user
 */
router.get('/progress/all', authenticateToken, async (req, res) => {
  try {
    const progress = await LearningProgress.getAllByUser(req.user.id);
    res.json(progress);
  } catch (error) {
    console.error('Get all progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
