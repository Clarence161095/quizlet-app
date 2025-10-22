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
    const stmt = db.prepare('SELECT * FROM sets WHERE folder_id = ? ORDER BY created_at DESC');
    return stmt.all(folderId);
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
    const stmt = db.prepare('SELECT * FROM flashcards WHERE set_id = ? ORDER BY created_at DESC');
    return stmt.all(setId);
  }
}

module.exports = Set;
