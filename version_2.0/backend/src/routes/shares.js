const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Share = require('../models/Share');
const Set = require('../models/Set');
const Folder = require('../models/Folder');
const User = require('../models/User');

/**
 * GET /api/shares/sent
 * Get all shares sent by current user
 */
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const setShares = await Share.getSetSharesSentByUser(req.user.id);
    const folderShares = await Share.getFolderSharesSentByUser(req.user.id);
    
    res.json({
      setShares,
      folderShares
    });
  } catch (error) {
    console.error('Get sent shares error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/shares/received
 * Get all shares received by current user
 */
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const setShares = await Share.getSetSharesReceivedByUser(req.user.id);
    const folderShares = await Share.getFolderSharesReceivedByUser(req.user.id);
    
    res.json({
      setShares,
      folderShares
    });
  } catch (error) {
    console.error('Get received shares error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/shares/pending-count
 * Get count of pending shares
 */
router.get('/pending-count', authenticateToken, async (req, res) => {
  try {
    const counts = await Share.getPendingSharesCount(req.user.id);
    res.json(counts);
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shares/set
 * Share a set with another user
 */
router.post('/set', authenticateToken, async (req, res) => {
  try {
    const { set_id, to_username, allow_export, message } = req.body;
    
    if (!set_id || !to_username) {
      return res.status(400).json({ error: 'Set ID and recipient username are required' });
    }

    // Verify set ownership
    const set = await Set.findById(set_id);
    if (!set || set.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Set not found' });
    }

    // Find recipient user
    const toUser = await User.findByUsername(to_username);
    if (!toUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (toUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot share with yourself' });
    }

    // Check if already shared
    const alreadyShared = await Share.isSetSharedWith(set_id, toUser.id);
    if (alreadyShared) {
      return res.status(400).json({ error: 'Set already shared with this user' });
    }

    const share = await Share.createSetShare({
      from_user_id: req.user.id,
      to_user_id: toUser.id,
      set_id,
      allow_export: allow_export || false,
      message: message || null
    });

    res.status(201).json(share);
  } catch (error) {
    console.error('Share set error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shares/folder
 * Share a folder with another user
 */
router.post('/folder', authenticateToken, async (req, res) => {
  try {
    const { folder_id, to_username, allow_export, message } = req.body;
    
    if (!folder_id || !to_username) {
      return res.status(400).json({ error: 'Folder ID and recipient username are required' });
    }

    // Verify folder ownership
    const folder = await Folder.findById(folder_id);
    if (!folder || folder.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Find recipient user
    const toUser = await User.findByUsername(to_username);
    if (!toUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (toUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot share with yourself' });
    }

    // Check if already shared
    const alreadyShared = await Share.isFolderSharedWith(folder_id, toUser.id);
    if (alreadyShared) {
      return res.status(400).json({ error: 'Folder already shared with this user' });
    }

    const share = await Share.createFolderShare({
      from_user_id: req.user.id,
      to_user_id: toUser.id,
      folder_id,
      allow_export: allow_export || false,
      message: message || null
    });

    res.status(201).json(share);
  } catch (error) {
    console.error('Share folder error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shares/set/:id/accept
 * Accept a set share (creates clone)
 */
router.post('/set/:id/accept', authenticateToken, async (req, res) => {
  try {
    const share = await Share.findSetShareById(req.params.id);
    
    if (!share || share.to_user_id !== req.user.id) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.status !== 'pending') {
      return res.status(400).json({ error: 'Share already processed' });
    }

    // Clone the set
    const sourceSet = await Set.findById(share.set_id);
    if (!sourceSet) {
      return res.status(404).json({ error: 'Original set not found' });
    }

    const clonedSet = await Set.clone(share.set_id, req.user.id);
    
    // Update share status
    await Share.acceptSetShare(req.params.id, clonedSet.id);

    res.json({ 
      message: 'Set share accepted successfully',
      clonedSet
    });
  } catch (error) {
    console.error('Accept set share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shares/folder/:id/accept
 * Accept a folder share (creates clone with all sets)
 */
router.post('/folder/:id/accept', authenticateToken, async (req, res) => {
  try {
    const share = await Share.findFolderShareById(req.params.id);
    
    if (!share || share.to_user_id !== req.user.id) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.status !== 'pending') {
      return res.status(400).json({ error: 'Share already processed' });
    }

    // Clone the folder
    const sourceFolder = await Folder.findById(share.folder_id);
    if (!sourceFolder) {
      return res.status(404).json({ error: 'Original folder not found' });
    }

    const clonedFolder = await Folder.clone(share.folder_id, req.user.id);
    
    // Update share status
    await Share.acceptFolderShare(req.params.id, clonedFolder.id);

    res.json({ 
      message: 'Folder share accepted successfully',
      clonedFolder
    });
  } catch (error) {
    console.error('Accept folder share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shares/set/:id/reject
 * Reject a set share
 */
router.post('/set/:id/reject', authenticateToken, async (req, res) => {
  try {
    const share = await Share.findSetShareById(req.params.id);
    
    if (!share || share.to_user_id !== req.user.id) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.status !== 'pending') {
      return res.status(400).json({ error: 'Share already processed' });
    }

    await Share.rejectSetShare(req.params.id);

    res.json({ message: 'Set share rejected successfully' });
  } catch (error) {
    console.error('Reject set share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shares/folder/:id/reject
 * Reject a folder share
 */
router.post('/folder/:id/reject', authenticateToken, async (req, res) => {
  try {
    const share = await Share.findFolderShareById(req.params.id);
    
    if (!share || share.to_user_id !== req.user.id) {
      return res.status(404).json({ error: 'Share not found' });
    }

    if (share.status !== 'pending') {
      return res.status(400).json({ error: 'Share already processed' });
    }

    await Share.rejectFolderShare(req.params.id);

    res.json({ message: 'Folder share rejected successfully' });
  } catch (error) {
    console.error('Reject folder share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/shares/set/:id
 * Delete a set share (sender only)
 */
router.delete('/set/:id', authenticateToken, async (req, res) => {
  try {
    const share = await Share.findSetShareById(req.params.id);
    
    if (!share || share.from_user_id !== req.user.id) {
      return res.status(404).json({ error: 'Share not found' });
    }

    await Share.deleteSetShare(req.params.id);

    res.json({ message: 'Set share deleted successfully' });
  } catch (error) {
    console.error('Delete set share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/shares/folder/:id
 * Delete a folder share (sender only)
 */
router.delete('/folder/:id', authenticateToken, async (req, res) => {
  try {
    const share = await Share.findFolderShareById(req.params.id);
    
    if (!share || share.from_user_id !== req.user.id) {
      return res.status(404).json({ error: 'Share not found' });
    }

    await Share.deleteFolderShare(req.params.id);

    res.json({ message: 'Folder share deleted successfully' });
  } catch (error) {
    console.error('Delete folder share error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
