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
    // Use junction table for many-to-many relationship
    const stmt = db.prepare(`
      SELECT s.* FROM sets s
      INNER JOIN folder_sets fs ON s.id = fs.set_id
      WHERE fs.folder_id = ?
      ORDER BY fs.added_at DESC, s.created_at DESC
    `);
    return stmt.all(folderId);
  }

  static getFlashcardsInFolder(folderId) {
    // Get all flashcards from sets in this folder (via junction table)
    const stmt = db.prepare(`
      SELECT f.* FROM flashcards f
      INNER JOIN sets s ON f.set_id = s.id
      INNER JOIN folder_sets fs ON s.id = fs.set_id
      WHERE fs.folder_id = ?
      ORDER BY fs.added_at ASC, f.order_index ASC, f.id ASC
    `);
    return stmt.all(folderId);
  }

  static addSetToFolder(folderId, setId) {
    // Add a set to a folder (many-to-many)
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO folder_sets (folder_id, set_id)
      VALUES (?, ?)
    `);
    return stmt.run(folderId, setId);
  }

  static removeSetFromFolder(folderId, setId) {
    // Remove a set from a folder
    const stmt = db.prepare(`
      DELETE FROM folder_sets
      WHERE folder_id = ? AND set_id = ?
    `);
    return stmt.run(folderId, setId);
  }

  static getFoldersForSet(setId) {
    // Get all folders that contain this set
    const stmt = db.prepare(`
      SELECT f.* FROM folders f
      INNER JOIN folder_sets fs ON f.id = fs.folder_id
      WHERE fs.set_id = ?
      ORDER BY fs.added_at DESC
    `);
    return stmt.all(setId);
  }
}

module.exports = Folder;
