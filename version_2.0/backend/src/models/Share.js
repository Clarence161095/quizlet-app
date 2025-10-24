const { query, queryOne, queryAll } = require('../config/database');

/**
 * Share Model
 * 
 * Manages sharing of sets and folders between users
 * Uses clone-based sharing with source tracking
 */
class Share {
  /**
   * Create a set share
   */
  static async createSetShare(data) {
    const { from_user_id, to_user_id, set_id, allow_export, message } = data;
    
    return await queryOne(
      `INSERT INTO set_shares (from_user_id, to_user_id, set_id, allow_export, message, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [from_user_id, to_user_id, set_id, allow_export || false, message || null]
    );
  }

  /**
   * Create a folder share
   */
  static async createFolderShare(data) {
    const { from_user_id, to_user_id, folder_id, allow_export, message } = data;
    
    return await queryOne(
      `INSERT INTO folder_shares (from_user_id, to_user_id, folder_id, allow_export, message, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [from_user_id, to_user_id, folder_id, allow_export || false, message || null]
    );
  }

  /**
   * Get set share by ID
   */
  static async findSetShareById(id) {
    return await queryOne(
      `SELECT ss.*, 
              s.name as set_name, 
              s.description as set_description,
              u1.username as from_username,
              u2.username as to_username
       FROM set_shares ss
       INNER JOIN sets s ON ss.set_id = s.id
       INNER JOIN users u1 ON ss.from_user_id = u1.id
       INNER JOIN users u2 ON ss.to_user_id = u2.id
       WHERE ss.id = $1`,
      [id]
    );
  }

  /**
   * Get folder share by ID
   */
  static async findFolderShareById(id) {
    return await queryOne(
      `SELECT fs.*, 
              f.name as folder_name, 
              f.description as folder_description,
              u1.username as from_username,
              u2.username as to_username
       FROM folder_shares fs
       INNER JOIN folders f ON fs.folder_id = f.id
       INNER JOIN users u1 ON fs.from_user_id = u1.id
       INNER JOIN users u2 ON fs.to_user_id = u2.id
       WHERE fs.id = $1`,
      [id]
    );
  }

  /**
   * Get all set shares sent by user
   */
  static async getSetSharesSentByUser(userId) {
    return await queryAll(
      `SELECT ss.*, 
              s.name as set_name,
              u.username as to_username
       FROM set_shares ss
       INNER JOIN sets s ON ss.set_id = s.id
       INNER JOIN users u ON ss.to_user_id = u.id
       WHERE ss.from_user_id = $1
       ORDER BY ss.created_at DESC`,
      [userId]
    );
  }

  /**
   * Get all folder shares sent by user
   */
  static async getFolderSharesSentByUser(userId) {
    return await queryAll(
      `SELECT fs.*, 
              f.name as folder_name,
              u.username as to_username
       FROM folder_shares fs
       INNER JOIN folders f ON fs.folder_id = f.id
       INNER JOIN users u ON fs.to_user_id = u.id
       WHERE fs.from_user_id = $1
       ORDER BY fs.created_at DESC`,
      [userId]
    );
  }

  /**
   * Get all set shares received by user
   */
  static async getSetSharesReceivedByUser(userId) {
    return await queryAll(
      `SELECT ss.*, 
              s.name as set_name,
              s.description as set_description,
              u.username as from_username
       FROM set_shares ss
       INNER JOIN sets s ON ss.set_id = s.id
       INNER JOIN users u ON ss.from_user_id = u.id
       WHERE ss.to_user_id = $1
       ORDER BY ss.created_at DESC`,
      [userId]
    );
  }

  /**
   * Get all folder shares received by user
   */
  static async getFolderSharesReceivedByUser(userId) {
    return await queryAll(
      `SELECT fs.*, 
              f.name as folder_name,
              f.description as folder_description,
              u.username as from_username
       FROM folder_shares fs
       INNER JOIN folders f ON fs.folder_id = f.id
       INNER JOIN users u ON fs.from_user_id = u.id
       WHERE fs.to_user_id = $1
       ORDER BY fs.created_at DESC`,
      [userId]
    );
  }

  /**
   * Accept a set share (update status and store cloned set ID)
   */
  static async acceptSetShare(id, clonedSetId) {
    return await queryOne(
      `UPDATE set_shares
       SET status = 'accepted', 
           cloned_set_id = $1,
           accepted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [clonedSetId, id]
    );
  }

  /**
   * Accept a folder share (update status and store cloned folder ID)
   */
  static async acceptFolderShare(id, clonedFolderId) {
    return await queryOne(
      `UPDATE folder_shares
       SET status = 'accepted', 
           cloned_folder_id = $1,
           accepted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [clonedFolderId, id]
    );
  }

  /**
   * Reject a set share
   */
  static async rejectSetShare(id) {
    return await queryOne(
      `UPDATE set_shares
       SET status = 'rejected',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
  }

  /**
   * Reject a folder share
   */
  static async rejectFolderShare(id) {
    return await queryOne(
      `UPDATE folder_shares
       SET status = 'rejected',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
  }

  /**
   * Mark share as "accepted but deleted" when cloned entity is deleted
   */
  static async markSetShareAsDeleted(id) {
    return await queryOne(
      `UPDATE set_shares
       SET status = 'accepted_but_deleted',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
  }

  /**
   * Mark folder share as "accepted but deleted"
   */
  static async markFolderShareAsDeleted(id) {
    return await queryOne(
      `UPDATE folder_shares
       SET status = 'accepted_but_deleted',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
  }

  /**
   * Delete a set share
   */
  static async deleteSetShare(id) {
    await query('DELETE FROM set_shares WHERE id = $1', [id]);
    return true;
  }

  /**
   * Delete a folder share
   */
  static async deleteFolderShare(id) {
    await query('DELETE FROM folder_shares WHERE id = $1', [id]);
    return true;
  }

  /**
   * Check if a set is already shared with a user
   */
  static async isSetSharedWith(setId, toUserId) {
    const result = await queryOne(
      `SELECT * FROM set_shares 
       WHERE set_id = $1 AND to_user_id = $2 AND status IN ('pending', 'accepted')`,
      [setId, toUserId]
    );
    return result !== null;
  }

  /**
   * Check if a folder is already shared with a user
   */
  static async isFolderSharedWith(folderId, toUserId) {
    const result = await queryOne(
      `SELECT * FROM folder_shares 
       WHERE folder_id = $1 AND to_user_id = $2 AND status IN ('pending', 'accepted')`,
      [folderId, toUserId]
    );
    return result !== null;
  }

  /**
   * Get pending shares count for a user
   */
  static async getPendingSharesCount(userId) {
    const setSharesCount = await queryOne(
      'SELECT COUNT(*) as count FROM set_shares WHERE to_user_id = $1 AND status = $2',
      [userId, 'pending']
    );
    
    const folderSharesCount = await queryOne(
      'SELECT COUNT(*) as count FROM folder_shares WHERE to_user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    return {
      setShares: setSharesCount ? parseInt(setSharesCount.count) : 0,
      folderShares: folderSharesCount ? parseInt(folderSharesCount.count) : 0,
      total: (setSharesCount ? parseInt(setSharesCount.count) : 0) + 
             (folderSharesCount ? parseInt(folderSharesCount.count) : 0)
    };
  }

  /**
   * Find share record by cloned set ID
   */
  static async findSetShareByClonedId(clonedSetId) {
    return await queryOne(
      `SELECT ss.*, 
              s.name as original_set_name,
              u.username as from_username
       FROM set_shares ss
       INNER JOIN sets s ON ss.set_id = s.id
       INNER JOIN users u ON ss.from_user_id = u.id
       WHERE ss.cloned_set_id = $1`,
      [clonedSetId]
    );
  }

  /**
   * Find share record by cloned folder ID
   */
  static async findFolderShareByClonedId(clonedFolderId) {
    return await queryOne(
      `SELECT fs.*, 
              f.name as original_folder_name,
              u.username as from_username
       FROM folder_shares fs
       INNER JOIN folders f ON fs.folder_id = f.id
       INNER JOIN users u ON fs.from_user_id = u.id
       WHERE fs.cloned_folder_id = $1`,
      [clonedFolderId]
    );
  }
}

module.exports = Share;
