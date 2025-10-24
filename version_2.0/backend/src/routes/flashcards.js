const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Flashcard = require('../models/Flashcard');
const Set = require('../models/Set');
const UserNote = require('../models/UserNote');

/**
 * GET /api/flashcards/set/:setId
 * Get all flashcards in a set with user data
 */
router.get('/set/:setId', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.setId);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    const flashcards = await Flashcard.getAllWithUserData(req.params.setId, req.user.id);
    
    res.json(flashcards);
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/flashcards/:id
 * Get flashcard by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const flashcard = await Flashcard.getWithUserData(req.params.id, req.user.id);
    
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const set = await Set.findById(flashcard.set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    res.json(flashcard);
  } catch (error) {
    console.error('Get flashcard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/flashcards
 * Create new flashcard
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { set_id, word, definition, is_starred, order_index } = req.body;
    
    if (!set_id || !word || !definition) {
      return res.status(400).json({ error: 'Set ID, word, and definition are required' });
    }

    const set = await Set.findById(set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    // Check if this is a cloned set
    if (set.source_set_id) {
      return res.status(403).json({ 
        error: 'Cannot add flashcards to cloned sets. Use "Update from source" or delete and recreate the set.' 
      });
    }

    const flashcard = await Flashcard.create({
      set_id,
      word: word.trim(),
      definition: definition.trim(),
      is_starred: is_starred || false,
      order_index: order_index !== undefined ? order_index : 0
    });

    res.status(201).json(flashcard);
  } catch (error) {
    console.error('Create flashcard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/flashcards/:id
 * Update flashcard
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const set = await Set.findById(flashcard.set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    // Check if this is a cloned set
    if (set.source_set_id) {
      return res.status(403).json({ 
        error: 'Cannot edit flashcards in cloned sets. Use "Update from source" or delete and recreate the set.' 
      });
    }

    const { word, definition } = req.body;
    
    const updatedFlashcard = await Flashcard.update(req.params.id, {
      word: word || flashcard.word,
      definition: definition || flashcard.definition
    });

    res.json(updatedFlashcard);
  } catch (error) {
    console.error('Update flashcard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/flashcards/:id
 * Delete flashcard
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const set = await Set.findById(flashcard.set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    // Check if this is a cloned set
    if (set.source_set_id) {
      return res.status(403).json({ 
        error: 'Cannot delete flashcards from cloned sets. Use "Update from source" or delete the entire set.' 
      });
    }

    await Flashcard.delete(req.params.id);
    res.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/flashcards/:id/toggle-star
 * Toggle star status
 */
router.post('/:id/toggle-star', authenticateToken, async (req, res) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);
    
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const set = await Set.findById(flashcard.set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const updatedFlashcard = await Flashcard.toggleStar(req.params.id);
    res.json(updatedFlashcard);
  } catch (error) {
    console.error('Toggle star error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/flashcards/batch-create
 * Create multiple flashcards at once
 */
router.post('/batch-create', authenticateToken, async (req, res) => {
  try {
    const { set_id, flashcards } = req.body;
    
    if (!set_id || !flashcards || !Array.isArray(flashcards)) {
      return res.status(400).json({ error: 'Set ID and flashcards array are required' });
    }

    const set = await Set.findById(set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    // Check if this is a cloned set
    if (set.source_set_id) {
      return res.status(403).json({ 
        error: 'Cannot add flashcards to cloned sets.' 
      });
    }

    await Flashcard.batchCreate(set_id, flashcards);
    
    res.json({ message: `Successfully created ${flashcards.length} flashcards` });
  } catch (error) {
    console.error('Batch create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/flashcards/update-order
 * Update order of flashcards
 */
router.post('/update-order', authenticateToken, async (req, res) => {
  try {
    const { set_id, flashcard_ids } = req.body;
    
    if (!set_id || !flashcard_ids || !Array.isArray(flashcard_ids)) {
      return res.status(400).json({ error: 'Set ID and flashcard IDs array are required' });
    }

    const set = await Set.findById(set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    await Flashcard.updateOrder(set_id, flashcard_ids);
    
    res.json({ message: 'Flashcard order updated successfully' });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/flashcards/:id/note
 * Get user note for flashcard
 */
router.get('/:id/note', authenticateToken, async (req, res) => {
  try {
    const note = await UserNote.findByUserAndFlashcard(req.user.id, req.params.id);
    
    if (!note) {
      return res.json({ content: null });
    }

    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/flashcards/:id/note
 * Create or update user note
 */
router.post('/:id/note', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const flashcard = await Flashcard.findById(req.params.id);
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const note = await UserNote.createOrUpdate(req.user.id, req.params.id, content.trim());
    
    res.json(note);
  } catch (error) {
    console.error('Create/update note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/flashcards/:id/note
 * Delete user note
 */
router.delete('/:id/note', authenticateToken, async (req, res) => {
  try {
    await UserNote.delete(req.user.id, req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
