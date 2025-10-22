const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');
const Set = require('../models/Set');
const Folder = require('../models/Folder');
const Flashcard = require('../models/Flashcard');
const LearningProgress = require('../models/LearningProgress');

// List all sets
router.get('/', ensureAuthenticated, checkMFA, (req, res) => {
  const sets = Set.findByUserId(req.user.id);
  
  // Add folder names to each set
  sets.forEach(set => {
    set.folderNames = Set.getFolderNames(set.id);
  });
  
  res.render('sets/index', {
    title: 'My Sets',
    user: req.user,
    sets
  });
});

// Create set page
router.get('/create', ensureAuthenticated, checkMFA, (req, res) => {
  const folders = Folder.findByUserId(req.user.id);
  res.render('sets/create', {
    title: 'Create Set',
    user: req.user,
    folders
  });
});

// Create set POST
router.post('/create', ensureAuthenticated, checkMFA, (req, res) => {
  const { name, description, folder_id } = req.body;
  const setId = Set.create(req.user.id, name, description, folder_id || null);
  res.redirect(`/sets/${setId}`);
});

// View set
router.get('/:id', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const flashcards = Set.getFlashcards(req.params.id);
  const stats = LearningProgress.getProgressStats(req.user.id, req.params.id);

  res.render('sets/view', {
    title: set.name,
    user: req.user,
    set,
    flashcards,
    stats
  });
});

// Edit set page
router.get('/:id/edit', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const folders = Folder.findByUserId(req.user.id);

  res.render('sets/edit', {
    title: 'Edit Set',
    user: req.user,
    set,
    folders
  });
});

// Edit set POST
router.post('/:id/edit', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const { name, description, folder_id } = req.body;
  Set.update(req.params.id, name, description, folder_id || null);
  res.redirect(`/sets/${req.params.id}`);
});

// Delete set
router.post('/:id/delete', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  Set.delete(req.params.id);
  res.redirect('/sets');
});

// Import flashcards page
router.get('/:id/import', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  res.render('sets/import', {
    title: `Import Flashcards - ${set.name}`,
    user: req.user,
    set
  });
});

// Helper function: Parse multi-choice question format
function parseMultiChoice(text) {
  // Multi-choice format:
  // Question text
  // A. Option A
  // B. Option B
  // XXXC. Correct Option  <- marked with XXX
  // D. Option D
  
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

// Import flashcards POST
router.post('/:id/import', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const { content, termDefinitionSeparator, noteSeparator, flashcardSeparator } = req.body;
  
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

  // Import flashcards with notes
  cards.forEach(card => {
    const flashcardId = Flashcard.create(req.params.id, card.word, card.definition);
    
    // If there's a note, create user note
    if (card.note && flashcardId) {
      const UserNote = require('../models/UserNote');
      UserNote.createOrUpdate(req.user.id, flashcardId, card.note);
    }
  });

  req.flash('success', `Successfully imported ${cards.length} flashcard(s)`);
  res.redirect(`/sets/${req.params.id}`);
});

// Helper function: Parse markdown format questions
function parseMarkdownQuestions(text) {
  // Parse markdown format:
  // ### Question
  // - [ ] Option A
  // - [x] Correct Option B
  // Optional note after options
  
  const flashcards = [];
  
  // Split by ### to get questions
  const questionBlocks = text.split(/###\s+/).filter(block => block.trim());
  
  questionBlocks.forEach(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;
    
    // First line is the question
    const question = lines[0].replace(/\?$/, '').trim() + '?';
    
    const options = [];
    const correctOptions = [];
    let note = '';
    
    // Parse options
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for checkbox format
      const checkedMatch = line.match(/^-\s*\[x\]\s*(.+)/i);
      const uncheckedMatch = line.match(/^-\s*\[\s*\]\s*(.+)/i);
      
      if (checkedMatch) {
        const optionText = checkedMatch[1].trim();
        const letter = String.fromCharCode(65 + options.length);
        options.push(`${letter}. ${optionText}`);
        correctOptions.push(letter);
      } else if (uncheckedMatch) {
        const optionText = uncheckedMatch[1].trim();
        const letter = String.fromCharCode(65 + options.length);
        options.push(`${letter}. ${optionText}`);
      } else if (line.startsWith('###')) {
        break;
      } else if (options.length > 0) {
        // Any text after options = note
        note += (note ? ' ' : '') + line;
      }
    }
    
    if (options.length >= 2 && correctOptions.length > 0) {
      // Build TERM: Question + Options + Note (if exists)
      let term = question + '\n' + options.join('\n');
      if (note) {
        term += 'YYY' + note;
      }
      
      // Build DEFINITION: Correct: A or Correct: A, C
      const definition = 'Correct: ' + correctOptions.join(', ');
      
      flashcards.push({ term, definition });
    }
  });
  
  return flashcards;
}

// Import flashcards from Markdown format
router.post('/:id/import-markdown', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const { content } = req.body;
  
  const flashcards = parseMarkdownQuestions(content);
  
  // Import flashcards
  flashcards.forEach(card => {
    Flashcard.create(req.params.id, card.term, card.definition);
  });

  req.flash('success', `Successfully imported ${flashcards.length} flashcard(s) from Markdown`);
  res.redirect(`/sets/${req.params.id}`);
});

// Export flashcards
router.get('/:id/export', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const flashcards = Set.getFlashcards(req.params.id);
  
  const termSep = req.query.termSep === 'tab' ? '\t' : ' ';
  const cardSep = req.query.cardSep === 'newline' ? '\n' : '\n\n';
  
  const content = flashcards.map(card => 
    `${card.word}${termSep}${card.definition}`
  ).join(cardSep);

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${set.name}.txt"`);
  res.send(content);
});

// Study set (long-term learning)
router.get('/:id/study', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const dueFlashcards = LearningProgress.getDueFlashcards(req.user.id, req.params.id);
  
  // Fetch user notes for each flashcard
  const UserNote = require('../models/UserNote');
  dueFlashcards.forEach(card => {
    const note = UserNote.findByUserAndFlashcard(req.user.id, card.id);
    card.user_note = note ? note.note : null;
  });

  res.render('study/session', {
    title: `Study: ${set.name}`,
    user: req.user,
    flashcards: dueFlashcards,
    studyType: 'long_term',
    entityType: 'set',
    entityId: req.params.id
  });
});

// Random study set
router.get('/:id/random', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(404).send('Set not found');
  }

  const type = req.query.type || 'all'; // 'all' or 'starred'
  let flashcards;

  if (type === 'starred') {
    flashcards = Flashcard.getStarredBySetId(req.params.id);
  } else {
    flashcards = Set.getFlashcards(req.params.id);
  }
  
  // Fetch user notes for each flashcard
  const UserNote = require('../models/UserNote');
  flashcards.forEach(card => {
    const note = UserNote.findByUserAndFlashcard(req.user.id, card.id);
    card.user_note = note ? note.note : null;
  });

  // Shuffle flashcards
  flashcards.sort(() => Math.random() - 0.5);

  res.render('study/session', {
    title: `Random Study: ${set.name}`,
    user: req.user,
    flashcards,
    studyType: type === 'starred' ? 'random_starred' : 'random_all',
    entityType: 'set',
    entityId: req.params.id
  });
});

module.exports = router;
