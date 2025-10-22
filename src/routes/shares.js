const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');
const Set = require('../models/Set');
const Folder = require('../models/Folder');
const Flashcard = require('../models/Flashcard');
const User = require('../models/User');
const crypto = require('crypto');
const { db } = require('../database/init');

// Share Set - Show form
router.get('/sets/:id/share', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    return res.status(403).send('Access denied');
  }
  
  // Get all users except current user
  const users = User.getAll().filter(u => u.id !== req.user.id);
  
  // Get existing shares
  const existingShares = db.prepare(`
    SELECT ss.*, u.username 
    FROM set_shares ss
    JOIN users u ON ss.shared_with_user_id = u.id
    WHERE ss.set_id = ? AND ss.shared_by_user_id = ?
  `).all(req.params.id, req.user.id);
  
  res.render('shares/share-set', {
    title: 'Share Set',
    set,
    users,
    existingShares
  });
});

// Share Set - POST
router.post('/sets/:id/share', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  const { username, allow_export } = req.body;
  
  if (!set || set.user_id !== req.user.id) {
    req.flash('error', 'Access denied');
    return res.redirect('/sets');
  }
  
  const targetUser = User.findByUsername(username);
  
  if (!targetUser) {
    req.flash('error', 'User not found');
    return res.redirect(`/shares/sets/${req.params.id}/share`);
  }
  
  if (targetUser.id === req.user.id) {
    req.flash('error', 'Cannot share with yourself');
    return res.redirect(`/shares/sets/${req.params.id}/share`);
  }
  
  // Check if already shared
  const existing = db.prepare(`
    SELECT * FROM set_shares 
    WHERE set_id = ? AND shared_with_user_id = ?
  `).get(req.params.id, targetUser.id);
  
  if (existing) {
    req.flash('error', 'Already shared with this user');
    return res.redirect(`/shares/sets/${req.params.id}/share`);
  }
  
  // Create share token
  const shareToken = crypto.randomBytes(32).toString('hex');
  const allowExport = allow_export ? 1 : 0;
  
  // Insert share
  db.prepare(`
    INSERT INTO set_shares (set_id, shared_by_user_id, shared_with_user_id, share_token, allow_export)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, targetUser.id, shareToken, allowExport);
  
  req.flash('success', `Set shared with ${username} successfully!`);
  res.redirect(`/shares/sets/${req.params.id}/share`);
});

// Access shared set
router.get('/sets/:token/view', ensureAuthenticated, checkMFA, (req, res) => {
  const share = db.prepare(`
    SELECT 
      ss.id as share_id,
      ss.set_id,
      ss.is_accepted,
      ss.allow_export,
      ss.created_at as shared_at,
      s.name as set_name,
      s.description as set_description,
      u.username as owner_username
    FROM set_shares ss
    JOIN sets s ON ss.set_id = s.id
    JOIN users u ON ss.shared_by_user_id = u.id
    WHERE ss.share_token = ? AND ss.shared_with_user_id = ?
  `).get(req.params.token, req.user.id);
  
  if (!share) {
    req.flash('error', 'Shared set not found or access denied');
    return res.redirect('/dashboard');
  }
  
  // If not yet accepted, clone the set
  if (!share.is_accepted) {
    // Clone set with source tracking and export permission
    const stmt = db.prepare(`
      INSERT INTO sets (user_id, name, description, folder_id, source_set_id, allow_export, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(
      req.user.id,
      `${share.set_name} (from ${share.owner_username})`,
      share.set_description,
      null,
      share.set_id, // Track source set
      share.allow_export // Copy export permission
    );
    const newSetId = result.lastInsertRowid;
    
    // Clone all flashcards
    const flashcards = Flashcard.findBySetId(share.set_id);
    flashcards.forEach(card => {
      Flashcard.create(newSetId, card.word, card.definition, 0); // Don't copy starred status
    });
    
    // Mark as accepted
    db.prepare(`
      UPDATE set_shares 
      SET is_accepted = 1, accepted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(share.share_id);
    
    const exportMsg = share.allow_export ? 'You can export this set.' : 'Export is disabled by the owner.';
    req.flash('success', `Set cloned successfully! ${exportMsg} Use "Update from Source" to sync latest changes.`);
    return res.redirect(`/sets/${newSetId}`);
  }
  
  // Already accepted, find the cloned set
  // Since we don't track cloned set ID, just redirect to sets page
  req.flash('info', 'You have already accepted this share. Check your sets.');
  res.redirect('/sets');
});

// Share Folder - Show form
router.get('/folders/:id/share', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    return res.status(403).send('Access denied');
  }
  
  // Get all users except current user
  const users = User.getAll().filter(u => u.id !== req.user.id);
  
  // Get existing shares
  const existingShares = db.prepare(`
    SELECT fs.*, u.username 
    FROM folder_shares fs
    JOIN users u ON fs.shared_with_user_id = u.id
    WHERE fs.folder_id = ? AND fs.shared_by_user_id = ?
  `).all(req.params.id, req.user.id);
  
  res.render('shares/share-folder', {
    title: 'Share Folder',
    folder,
    users,
    existingShares
  });
});

// Share Folder - POST
router.post('/folders/:id/share', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  const { username, allow_export } = req.body;
  
  if (!folder || folder.user_id !== req.user.id) {
    req.flash('error', 'Access denied');
    return res.redirect('/folders');
  }
  
  const targetUser = User.findByUsername(username);
  
  if (!targetUser) {
    req.flash('error', 'User not found');
    return res.redirect(`/shares/folders/${req.params.id}/share`);
  }
  
  if (targetUser.id === req.user.id) {
    req.flash('error', 'Cannot share with yourself');
    return res.redirect(`/shares/folders/${req.params.id}/share`);
  }
  
  // Check if already shared
  const existing = db.prepare(`
    SELECT * FROM folder_shares 
    WHERE folder_id = ? AND shared_with_user_id = ?
  `).get(req.params.id, targetUser.id);
  
  if (existing) {
    req.flash('error', 'Already shared with this user');
    return res.redirect(`/shares/folders/${req.params.id}/share`);
  }
  
  // Create share token
  const shareToken = crypto.randomBytes(32).toString('hex');
  const allowExport = allow_export ? 1 : 0;
  
  // Insert share
  db.prepare(`
    INSERT INTO folder_shares (folder_id, shared_by_user_id, shared_with_user_id, share_token, allow_export)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, targetUser.id, shareToken, allowExport);
  
  req.flash('success', `Folder shared with ${username} successfully!`);
  res.redirect(`/shares/folders/${req.params.id}/share`);
});

// Access shared folder
router.get('/folders/:token/view', ensureAuthenticated, checkMFA, (req, res) => {
  const share = db.prepare(`
    SELECT 
      fs.id as share_id,
      fs.folder_id,
      fs.is_accepted,
      fs.allow_export,
      fs.created_at as shared_at,
      f.name as folder_name,
      f.description as folder_description,
      u.username as owner_username
    FROM folder_shares fs
    JOIN folders f ON fs.folder_id = f.id
    JOIN users u ON fs.shared_by_user_id = u.id
    WHERE fs.share_token = ? AND fs.shared_with_user_id = ?
  `).get(req.params.token, req.user.id);
  
  if (!share) {
    req.flash('error', 'Shared folder not found or access denied');
    return res.redirect('/dashboard');
  }
  
  // If not yet accepted, clone the folder and all sets
  if (!share.is_accepted) {
    // Clone folder with source tracking and export permission
    const stmtFolder = db.prepare(`
      INSERT INTO folders (user_id, name, description, source_folder_id, allow_export, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const resultFolder = stmtFolder.run(
      req.user.id,
      `${share.folder_name} (from ${share.owner_username})`,
      share.folder_description,
      share.folder_id, // Track source folder
      share.allow_export // Copy export permission
    );
    const newFolderId = resultFolder.lastInsertRowid;
    
    // Clone all sets in folder
    const sets = Set.findByFolderId(share.folder_id);
    sets.forEach(set => {
      // Clone set with source tracking and same export permission
      const stmtSet = db.prepare(`
        INSERT INTO sets (user_id, name, description, folder_id, source_set_id, allow_export, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      const resultSet = stmtSet.run(
        req.user.id,
        set.name,
        set.description,
        newFolderId,
        set.id, // Track source set
        share.allow_export // Copy export permission
      );
      const newSetId = resultSet.lastInsertRowid;
      
      // Clone all flashcards in set
      const flashcards = Flashcard.findBySetId(set.id);
      flashcards.forEach(card => {
        Flashcard.create(newSetId, card.word, card.definition, 0);
      });
    });
    
    // Mark as accepted
    db.prepare(`
      UPDATE folder_shares 
      SET is_accepted = 1, accepted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(share.share_id);
    
    const exportMsg = share.allow_export ? 'You can export sets in this folder.' : 'Export is disabled by the owner.';
    req.flash('success', `Folder cloned successfully! ${exportMsg} Use "Update from Source" to sync latest changes.`);
    return res.redirect(`/folders/${newFolderId}`);
  }
  
  // Already accepted
  req.flash('info', 'You have already accepted this share. Check your folders.');
  res.redirect('/folders');
});

// My shared items
router.get('/my-shares', ensureAuthenticated, checkMFA, (req, res) => {
  // Items shared with me (received shares)
  const receivedSets = db.prepare(`
    SELECT ss.*, s.name, u.username as owner_username, ss.share_token
    FROM set_shares ss
    JOIN sets s ON ss.set_id = s.id
    JOIN users u ON ss.shared_by_user_id = u.id
    WHERE ss.shared_with_user_id = ?
    ORDER BY ss.is_accepted ASC, ss.created_at DESC
  `).all(req.user.id);
  
  const receivedFolders = db.prepare(`
    SELECT fs.*, f.name, u.username as owner_username, fs.share_token
    FROM folder_shares fs
    JOIN folders f ON fs.folder_id = f.id
    JOIN users u ON fs.shared_by_user_id = u.id
    WHERE fs.shared_with_user_id = ?
    ORDER BY fs.is_accepted ASC, fs.created_at DESC
  `).all(req.user.id);
  
  // Combine and add type
  const receivedShares = [
    ...receivedSets.map(s => ({ ...s, type: 'set' })),
    ...receivedFolders.map(f => ({ ...f, type: 'folder' }))
  ].sort((a, b) => {
    // Sort by is_accepted first (pending first), then by date
    if (a.is_accepted !== b.is_accepted) {
      return a.is_accepted - b.is_accepted;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });
  
  // Items I shared with others (sent shares)
  // Check if cloned sets/folders still exist
  const sentSets = db.prepare(`
    SELECT 
      ss.id as share_id,
      ss.set_id,
      ss.shared_with_user_id,
      ss.is_accepted,
      ss.created_at,
      s.name, 
      u.username as shared_with_username,
      s.id as entity_id,
      (SELECT COUNT(*) FROM sets WHERE source_set_id = ss.set_id AND user_id = ss.shared_with_user_id) as clone_exists
    FROM set_shares ss
    JOIN sets s ON ss.set_id = s.id
    JOIN users u ON ss.shared_with_user_id = u.id
    WHERE ss.shared_by_user_id = ?
    ORDER BY ss.created_at DESC
  `).all(req.user.id);
  
  const sentFolders = db.prepare(`
    SELECT 
      fs.id as share_id,
      fs.folder_id,
      fs.shared_with_user_id,
      fs.is_accepted,
      fs.created_at,
      f.name, 
      u.username as shared_with_username,
      f.id as entity_id,
      (SELECT COUNT(*) FROM folders WHERE source_folder_id = fs.folder_id AND user_id = fs.shared_with_user_id) as clone_exists
    FROM folder_shares fs
    JOIN folders f ON fs.folder_id = f.id
    JOIN users u ON fs.shared_with_user_id = u.id
    WHERE fs.shared_by_user_id = ?
    ORDER BY fs.created_at DESC
  `).all(req.user.id);
  
  const sentShares = [
    ...sentSets.map(s => ({ ...s, type: 'set' })),
    ...sentFolders.map(f => ({ ...f, type: 'folder' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  res.render('shares/my-shares', {
    title: 'My Shares',
    receivedShares,
    sentShares
  });
});

// Update cloned set from source
router.post('/sets/:id/update-from-source', ensureAuthenticated, checkMFA, (req, res) => {
  const set = Set.findById(req.params.id);
  
  if (!set || set.user_id !== req.user.id) {
    req.flash('error', 'Access denied');
    return res.redirect('/sets');
  }
  
  if (!set.source_set_id) {
    req.flash('error', 'This set is not cloned from another set');
    return res.redirect(`/sets/${req.params.id}`);
  }
  
  const sourceSet = Set.findById(set.source_set_id);
  
  if (!sourceSet) {
    req.flash('error', 'Source set no longer exists');
    return res.redirect(`/sets/${req.params.id}`);
  }
  
  // Delete all current flashcards (but keep learning progress)
  db.prepare('DELETE FROM flashcards WHERE set_id = ?').run(req.params.id);
  
  // Clone flashcards from source
  const sourceFlashcards = Flashcard.findBySetId(set.source_set_id);
  sourceFlashcards.forEach(card => {
    Flashcard.create(req.params.id, card.word, card.definition, 0);
  });
  
  // Update set metadata
  db.prepare(`
    UPDATE sets 
    SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    `${sourceSet.name} (from source)`,
    sourceSet.description,
    req.params.id
  );
  
  req.flash('success', `Set updated successfully with ${sourceFlashcards.length} flashcards from source!`);
  res.redirect(`/sets/${req.params.id}`);
});

// Update cloned folder from source
router.post('/folders/:id/update-from-source', ensureAuthenticated, checkMFA, (req, res) => {
  const folder = Folder.findById(req.params.id);
  
  if (!folder || folder.user_id !== req.user.id) {
    req.flash('error', 'Access denied');
    return res.redirect('/folders');
  }
  
  if (!folder.source_folder_id) {
    req.flash('error', 'This folder is not cloned from another folder');
    return res.redirect(`/folders/${req.params.id}`);
  }
  
  const sourceFolder = Folder.findById(folder.source_folder_id);
  
  if (!sourceFolder) {
    req.flash('error', 'Source folder no longer exists');
    return res.redirect(`/folders/${req.params.id}`);
  }
  
  // Delete all sets in cloned folder
  const currentSets = Set.findByFolderId(req.params.id);
  currentSets.forEach(set => {
    db.prepare('DELETE FROM flashcards WHERE set_id = ?').run(set.id);
    db.prepare('DELETE FROM sets WHERE id = ?').run(set.id);
  });
  
  // Clone all sets from source folder
  const sourceSets = Set.findByFolderId(folder.source_folder_id);
  sourceSets.forEach(sourceSet => {
    const stmtSet = db.prepare(`
      INSERT INTO sets (user_id, name, description, folder_id, source_set_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const resultSet = stmtSet.run(
      req.user.id,
      sourceSet.name,
      sourceSet.description,
      req.params.id,
      sourceSet.id
    );
    const newSetId = resultSet.lastInsertRowid;
    
    // Clone flashcards
    const flashcards = Flashcard.findBySetId(sourceSet.id);
    flashcards.forEach(card => {
      Flashcard.create(newSetId, card.word, card.definition, 0);
    });
  });
  
  // Update folder metadata
  db.prepare(`
    UPDATE folders 
    SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    `${sourceFolder.name} (from source)`,
    sourceFolder.description,
    req.params.id
  );
  
  req.flash('success', `Folder updated successfully with ${sourceSets.length} sets from source!`);
  res.redirect(`/folders/${req.params.id}`);
});

// Reshare - Reset share to pending state
router.post('/reshare/set/:shareId', ensureAuthenticated, checkMFA, (req, res) => {
  const share = db.prepare(`
    SELECT ss.*, s.user_id as owner_id
    FROM set_shares ss
    JOIN sets s ON ss.set_id = s.id
    WHERE ss.id = ?
  `).get(req.params.shareId);
  
  if (!share || share.owner_id !== req.user.id) {
    req.flash('error', 'Access denied');
    return res.redirect('/shares/my-shares');
  }
  
  // Reset to pending state
  db.prepare(`
    UPDATE set_shares 
    SET is_accepted = 0, accepted_at = NULL, created_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.shareId);
  
  req.flash('success', 'Share reset to pending. Recipient can accept again.');
  res.redirect('/shares/my-shares');
});

router.post('/reshare/folder/:shareId', ensureAuthenticated, checkMFA, (req, res) => {
  const share = db.prepare(`
    SELECT fs.*, f.user_id as owner_id
    FROM folder_shares fs
    JOIN folders f ON fs.folder_id = f.id
    WHERE fs.id = ?
  `).get(req.params.shareId);
  
  if (!share || share.owner_id !== req.user.id) {
    req.flash('error', 'Access denied');
    return res.redirect('/shares/my-shares');
  }
  
  // Reset to pending state
  db.prepare(`
    UPDATE folder_shares 
    SET is_accepted = 0, accepted_at = NULL, created_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.shareId);
  
  req.flash('success', 'Share reset to pending. Recipient can accept again.');
  res.redirect('/shares/my-shares');
});

module.exports = router;
