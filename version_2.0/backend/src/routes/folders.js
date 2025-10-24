const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Folder = require('../models/Folder');
const Set = require('../models/Set');
const LearningProgress = require('../models/LearningProgress');
const Share = require('../models/Share');

/**
 * GET /api/folders
 * Get all folders for current user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const folders = await Folder.findByUserId(req.user.id);
    
    // Add set count for each folder
    for (const folder of folders) {
      const sets = await Folder.getSetsInFolder(folder.id);
      folder.setCount = sets.length;
    }
    
    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/folders/:id
 * Get folder by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const sets = await Folder.getSetsInFolder(req.params.id);
    const stats = await LearningProgress.getProgressStatsForFolder(req.user.id, req.params.id);

    res.json({
      folder,
      sets,
      stats
    });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/folders
 * Create new folder
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = await Folder.create({
      user_id: req.user.id,
      name: name.trim(),
      description: description || null
    });

    res.status(201).json(folder);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/folders/:id
 * Update folder
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if this is a cloned folder
    if (folder.source_folder_id) {
      return res.status(403).json({ 
        error: 'Cannot edit cloned folders directly. Use "Update from source" or delete and recreate.' 
      });
    }

    const { name, description } = req.body;
    
    const updatedFolder = await Folder.update(req.params.id, {
      name: name || folder.name,
      description: description !== undefined ? description : folder.description
    });

    res.json(updatedFolder);
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/folders/:id
 * Delete folder
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // If this is a cloned folder, mark share as deleted
    if (folder.source_folder_id) {
      const shareRecord = await Share.findFolderShareByClonedId(folder.id);
      if (shareRecord) {
        await Share.markFolderShareAsDeleted(shareRecord.id);
      }
    }

    await Folder.delete(req.params.id);
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/folders/:id/update-from-source
 * Update cloned folder from source
 */
router.post('/:id/update-from-source', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (!folder.source_folder_id) {
      return res.status(400).json({ error: 'This folder is not a clone' });
    }

    const sourceFolder = await Folder.findById(folder.source_folder_id);
    if (!sourceFolder) {
      return res.status(404).json({ error: 'Source folder not found or was deleted' });
    }

    await Folder.updateFromSource(req.params.id, req.user.id);
    
    res.json({ message: 'Folder updated from source successfully' });
  } catch (error) {
    console.error('Update from source error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/folders/:id/manage-sets
 * Get all user sets for managing folder-set relationships
 */
router.get('/:id/manage-sets', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const allSets = await Set.findByUserId(req.user.id);
    const folderSets = await Folder.getSetsInFolder(req.params.id);
    
    const folderSetIds = new Set(folderSets.map(s => s.id));
    
    const setsNotInFolder = allSets.filter(s => !folderSetIds.has(s.id));
    
    res.json({
      folder,
      setsInFolder: folderSets,
      setsNotInFolder
    });
  } catch (error) {
    console.error('Get manage sets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/folders/:id/add-set
 * Add set to folder
 */
router.post('/:id/add-set', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const { set_id } = req.body;
    
    if (!set_id) {
      return res.status(400).json({ error: 'Set ID is required' });
    }

    const set = await Set.findById(set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    await Folder.addSetToFolder(req.params.id, set_id);
    
    res.json({ message: 'Set added to folder successfully' });
  } catch (error) {
    console.error('Add set to folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/folders/:id/remove-set
 * Remove set from folder
 */
router.post('/:id/remove-set', authenticateToken, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const { set_id } = req.body;
    
    if (!set_id) {
      return res.status(400).json({ error: 'Set ID is required' });
    }

    await Folder.removeSetFromFolder(req.params.id, set_id);
    
    res.json({ message: 'Set removed from folder successfully' });
  } catch (error) {
    console.error('Remove set from folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
