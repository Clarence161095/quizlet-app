const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Set = require('../models/Set');
const Folder = require('../models/Folder');
const LearningProgress = require('../models/LearningProgress');
const Share = require('../models/Share');

/**
 * GET /api/dashboard
 * Get dashboard overview for current user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user's sets and folders
    const sets = await Set.findByUserId(req.user.id);
    const folders = await Folder.findByUserId(req.user.id);
    
    // Calculate total flashcards and learning stats
    let totalFlashcards = 0;
    let totalLearned = 0;
    let totalLearning = 0;
    let totalNew = 0;
    
    for (const set of sets) {
      const stats = await LearningProgress.getProgressStats(req.user.id, set.id);
      totalFlashcards += stats.total;
      totalLearned += stats.learned;
      totalLearning += stats.learning;
      totalNew += stats.new;
    }
    
    // Get pending shares count
    const pendingShares = await Share.getPendingSharesCount(req.user.id);
    
    // Get recent learning progress
    const recentProgress = await LearningProgress.getAllByUser(req.user.id);
    const recentCards = recentProgress.slice(0, 10); // Last 10 studied cards
    
    res.json({
      stats: {
        totalSets: sets.length,
        totalFolders: folders.length,
        totalFlashcards,
        learned: totalLearned,
        learning: totalLearning,
        new: totalNew
      },
      pendingShares,
      recentCards,
      sets: sets.slice(0, 5), // Show 5 most recent sets
      folders: folders.slice(0, 5) // Show 5 most recent folders
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
