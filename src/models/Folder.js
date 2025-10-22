const { db } = require('../database/init');

class Folder {
  static create(userId, name, description = null) {
    const stmt = db.prepare(`
      INSERT INTO folders (user_id, name, description)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(userId, name, description);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM folders WHERE id = ?');
    return stmt.get(id);
  }

  static findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId);
  }

  static update(id, name, description) {
    const stmt = db.prepare(`
      UPDATE folders 
      SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(name, description, id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM folders WHERE id = ?');
    return stmt.run(id);
  }

  static getSetsInFolder(folderId) {
    const stmt = db.prepare('SELECT * FROM sets WHERE folder_id = ? ORDER BY created_at DESC');
    return stmt.all(folderId);
  }

  static getFlashcardsInFolder(folderId) {
    const stmt = db.prepare(`
      SELECT f.* FROM flashcards f
      INNER JOIN sets s ON f.set_id = s.id
      WHERE s.folder_id = ?
      ORDER BY f.created_at DESC
    `);
    return stmt.all(folderId);
  }
}

module.exports = Folder;
