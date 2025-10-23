const { db } = require('../database/init');

class Set {
  static create(userId, name, description = null, folderId = null) {
    const stmt = db.prepare(`
      INSERT INTO sets (user_id, name, description, folder_id)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, name, description, folderId);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM sets WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserId(userId) {
    // Note: This query still uses folder_id for backward compatibility
    // For many-to-many, use Folder.getFoldersForSet(setId) instead
    const stmt = db.prepare(`
      SELECT s.*, f.name as folder_name 
      FROM sets s
      LEFT JOIN folders f ON s.folder_id = f.id
      WHERE s.user_id = ? 
      ORDER BY s.created_at DESC
    `);
    return stmt.all(userId);
  }

  static findByFolderId(folderId) {
    // Use junction table for many-to-many relationship
    const stmt = db.prepare(`
      SELECT s.* FROM sets s
      INNER JOIN folder_sets fs ON s.id = fs.set_id
      WHERE fs.folder_id = ?
      ORDER BY fs.added_at DESC, s.created_at DESC
    `);
    return stmt.all(folderId);
  }

  static getFolderNames(setId) {
    // Get all folder names that contain this set (for display)
    const stmt = db.prepare(`
      SELECT f.name FROM folders f
      INNER JOIN folder_sets fs ON f.id = fs.folder_id
      WHERE fs.set_id = ?
      ORDER BY f.name ASC
    `);
    const folders = stmt.all(setId);
    return folders.map(f => f.name).join(', ') || 'No folder';
  }

  static update(id, name, description, folderId) {
    const stmt = db.prepare(`
      UPDATE sets 
      SET name = ?, description = ?, folder_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(name, description, folderId, id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM sets WHERE id = ?');
    return stmt.run(id);
  }

  static getFlashcardCount(setId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM flashcards WHERE set_id = ?');
    return stmt.get(setId).count;
  }

  static getFlashcards(setId) {
    const stmt = db.prepare('SELECT * FROM flashcards WHERE set_id = ? ORDER BY order_index ASC, id ASC');
    return stmt.all(setId);
  }
}

module.exports = Set;
