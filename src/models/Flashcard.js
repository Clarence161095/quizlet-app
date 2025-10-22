const { db } = require('../database/init');

class Flashcard {
  static create(setId, word, definition, isStarred = 0) {
    const stmt = db.prepare(`
      INSERT INTO flashcards (set_id, word, definition, is_starred)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(setId, word, definition, isStarred);
    return result.lastInsertRowid;
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM flashcards WHERE id = ?');
    return stmt.get(id);
  }

  static findBySetId(setId) {
    const stmt = db.prepare('SELECT * FROM flashcards WHERE set_id = ? ORDER BY created_at DESC');
    return stmt.all(setId);
  }

  static update(id, word, definition, isStarred) {
    const stmt = db.prepare(`
      UPDATE flashcards 
      SET word = ?, definition = ?, is_starred = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(word, definition, isStarred, id);
  }

  static toggleStar(id) {
    const stmt = db.prepare(`
      UPDATE flashcards 
      SET is_starred = NOT is_starred, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM flashcards WHERE id = ?');
    return stmt.run(id);
  }

  static bulkCreate(setId, flashcards) {
    const stmt = db.prepare(`
      INSERT INTO flashcards (set_id, word, definition)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((cards) => {
      for (const card of cards) {
        stmt.run(setId, card.word, card.definition);
      }
    });

    insertMany(flashcards);
  }

  static getStarredBySetId(setId) {
    const stmt = db.prepare('SELECT * FROM flashcards WHERE set_id = ? AND is_starred = 1');
    return stmt.all(setId);
  }

  static getStarredByFolderId(folderId) {
    // Use junction table for many-to-many relationship
    const stmt = db.prepare(`
      SELECT f.* FROM flashcards f
      INNER JOIN sets s ON f.set_id = s.id
      INNER JOIN folder_sets fs ON s.id = fs.set_id
      WHERE fs.folder_id = ? AND f.is_starred = 1
      ORDER BY fs.added_at ASC, f.created_at DESC
    `);
    return stmt.all(folderId);
  }
}

module.exports = Flashcard;
