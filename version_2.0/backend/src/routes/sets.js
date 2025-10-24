const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Set = require('../models/Set');
const Folder = require('../models/Folder');
const Flashcard = require('../models/Flashcard');
const LearningProgress = require('../models/LearningProgress');
const UserNote = require('../models/UserNote');
const Share = require('../models/Share');

/**
 * GET /api/sets
 * Get all sets for current user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const sets = await Set.findByUserId(req.user.id);
    
    // Add folder names and flashcard count for each set
    for (const set of sets) {
      const folders = await Folder.getFoldersForSet(set.id);
      set.folderNames = folders.map(f => f.name);
      set.flashcardCount = await Flashcard.countBySet(set.id);
    }
    
    res.json(sets);
  } catch (error) {
    console.error('Get sets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sets/:id
 * Get set by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.id);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    const flashcards = await Flashcard.findBySetId(req.params.id);
    const stats = await LearningProgress.getProgressStats(req.user.id, req.params.id);
    const folders = await Folder.getFoldersForSet(req.params.id);

    res.json({
      set,
      flashcards,
      stats,
      folders
    });
  } catch (error) {
    console.error('Get set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/sets
 * Create new set
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, folder_id } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Set name is required' });
    }

    const set = await Set.create({
      user_id: req.user.id,
      name: name.trim(),
      description: description || null,
      folder_id: folder_id || null
    });

    res.status(201).json(set);
  } catch (error) {
    console.error('Create set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/sets/:id
 * Update set
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.id);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    // Check if this is a cloned set (has source_set_id)
    if (set.source_set_id) {
      return res.status(403).json({ 
        error: 'Cannot edit cloned sets directly. Use "Update from source" or delete and recreate.' 
      });
    }

    const { name, description, folder_id } = req.body;
    
    const updatedSet = await Set.update(req.params.id, {
      name: name || set.name,
      description: description !== undefined ? description : set.description,
      folder_id: folder_id !== undefined ? folder_id : set.folder_id
    });

    res.json(updatedSet);
  } catch (error) {
    console.error('Update set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/sets/:id
 * Delete set
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.id);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    // If this is a cloned set, mark share as deleted
    if (set.source_set_id) {
      const shareRecord = await Share.findSetShareByClonedId(set.id);
      if (shareRecord) {
        await Share.markSetShareAsDeleted(shareRecord.id);
      }
    }

    await Set.delete(req.params.id);
    res.json({ message: 'Set deleted successfully' });
  } catch (error) {
    console.error('Delete set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/sets/:id/update-from-source
 * Update cloned set from source (preserves learning progress)
 */
router.post('/:id/update-from-source', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.id);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    if (!set.source_set_id) {
      return res.status(400).json({ error: 'This set is not a clone' });
    }

    const sourceSet = await Set.findById(set.source_set_id);
    if (!sourceSet) {
      return res.status(404).json({ error: 'Source set not found or was deleted' });
    }

    await Set.updateFromSource(req.params.id, req.user.id);
    
    res.json({ message: 'Set updated from source successfully' });
  } catch (error) {
    console.error('Update from source error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Helper function: Parse multi-choice question format
 */
function parseMultiChoice(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length === 0) return null;
  
  const question = lines[0];
  const options = [];
  let correctAnswer = null;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line starts with XXX (correct answer marker)
    if (line.startsWith('XXX')) {
      const cleanLine = line.substring(3).trim();
      const match = cleanLine.match(/^([A-Z])\.\s*(.+)/);
      if (match) {
        correctAnswer = match[1];
        options.push(`${match[1]}. ${match[2]}`);
      }
    } else {
      const match = line.match(/^([A-Z])\.\s*(.+)/);
      if (match) {
        options.push(line);
      }
    }
  }
  
  // Validate multi-choice structure
  if (options.length >= 2 && correctAnswer) {
    const term = question;
    const definition = options.join('\n') + '\n\n✓ Correct: ' + correctAnswer;
    return { term, definition };
  }
  
  return null;
}

/**
 * POST /api/sets/:id/import
 * Import flashcards with custom separators
 */
router.post('/:id/import', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.id);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    // Check if this is a cloned set
    if (set.source_set_id) {
      return res.status(403).json({ 
        error: 'Cannot import into cloned sets. Use "Update from source" or delete and recreate.' 
      });
    }

    const { content, termDefinitionSeparator, noteSeparator, flashcardSeparator } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Import content is required' });
    }

    // Parse separators - handle special characters
    const termDefSep = termDefinitionSeparator === '\\t' || termDefinitionSeparator.toLowerCase() === 'tab' 
      ? '\t' 
      : termDefinitionSeparator;
    
    const noteSep = noteSeparator === '\\t' || noteSeparator.toLowerCase() === 'tab' 
      ? '\t' 
      : noteSeparator;
    
    const flashcardSep = flashcardSeparator === '\\n\\n' 
      ? '\n\n' 
      : flashcardSeparator;
    
    // Split by flashcard separator
    const flashcardBlocks = content.split(flashcardSep).filter(block => block.trim());
    
    const cards = flashcardBlocks.map(block => {
      block = block.trim();
      
      // Try multi-choice parser first
      const multiChoice = parseMultiChoice(block);
      if (multiChoice) {
        return {
          word: multiChoice.term,
          definition: multiChoice.definition,
          note: null
        };
      }
      
      // Regular parsing with separators
      const parts = block.split(termDefSep);
      
      if (parts.length >= 2) {
        const term = parts[0].trim();
        const remaining = parts.slice(1).join(termDefSep);
        
        let definition = '';
        let note = '';
        
        // Check if there's a note separator
        if (noteSep && remaining.includes(noteSep)) {
          const defNoteParts = remaining.split(noteSep);
          definition = defNoteParts[0].trim();
          note = defNoteParts.slice(1).join(noteSep).trim();
        } else {
          definition = remaining.trim();
        }
        
        return {
          word: term,
          definition: definition,
          note: note || null
        };
      }
      return null;
    }).filter(card => card && card.word && card.definition);

    if (cards.length === 0) {
      return res.status(400).json({ error: 'No valid flashcards found in import content' });
    }

    // Get max order_index to append at end
    const existingCards = await Flashcard.findBySetId(req.params.id);
    const maxOrder = existingCards.length > 0 
      ? Math.max(...existingCards.map(c => c.order_index || 0)) 
      : -1;

    // Import flashcards with notes - preserve order using index
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const flashcard = await Flashcard.create({
        set_id: req.params.id,
        word: card.word,
        definition: card.definition,
        is_starred: false,
        order_index: maxOrder + 1 + i
      });
      
      // If there's a note, create user note
      if (card.note && flashcard) {
        await UserNote.createOrUpdate(req.user.id, flashcard.id, card.note);
      }
    }

    res.json({ 
      message: `Successfully imported ${cards.length} flashcard(s)`,
      count: cards.length 
    });
  } catch (error) {
    console.error('Import flashcards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/sets/:id/export
 * Export flashcards with user notes
 */
router.get('/:id/export', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.id);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    // If this is a cloned set, check export permission
    if (set.source_set_id) {
      const shareRecord = await Share.findSetShareByClonedId(set.id);
      if (shareRecord && !shareRecord.allow_export) {
        return res.status(403).json({ 
          error: 'Export is not allowed for this shared set' 
        });
      }
    }

    const flashcards = await Flashcard.findBySetId(req.params.id);
    
    // Get user notes for each flashcard
    for (const card of flashcards) {
      const note = await UserNote.findByUserAndFlashcard(req.user.id, card.id);
      card.note = note ? note.content : null;
    }
    
    const format = req.query.format || 'custom';
    
    res.json({
      set,
      flashcards,
      format
    });
  } catch (error) {
    console.error('Export flashcards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/sets/:id/add-to-folder
 * Add set to folder (many-to-many)
 */
router.post('/:id/add-to-folder', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.id);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    const { folder_id } = req.body;
    
    if (!folder_id) {
      return res.status(400).json({ error: 'Folder ID is required' });
    }

    const folder = await Folder.findById(folder_id);
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    await Folder.addSetToFolder(folder_id, req.params.id);
    
    res.json({ message: 'Set added to folder successfully' });
  } catch (error) {
    console.error('Add to folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/sets/:id/remove-from-folder
 * Remove set from folder
 */
router.post('/:id/remove-from-folder', authenticateToken, async (req, res) => {
  try {
    const set = await Set.findById(req.params.id);
    
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    const { folder_id } = req.body;
    
    if (!folder_id) {
      return res.status(400).json({ error: 'Folder ID is required' });
    }

    await Folder.removeSetFromFolder(folder_id, req.params.id);
    
    res.json({ message: 'Set removed from folder successfully' });
  } catch (error) {
    console.error('Remove from folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
