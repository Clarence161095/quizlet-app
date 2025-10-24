const { db } = require('../database/init');

class UserNote {
  static createOrUpdate(userId, flashcardId, note) {
    const existing = this.findByUserAndFlashcard(userId, flashcardId);

    if (existing) {
      const stmt = db.prepare(`
        UPDATE user_notes
        SET note = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND flashcard_id = ?
      `);
      stmt.run(note, userId, flashcardId);
      return existing.id;
    } else {
      const stmt = db.prepare(`
        INSERT INTO user_notes (user_id, flashcard_id, note)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(userId, flashcardId, note);
      return result.lastInsertRowid;
    }
  }

  static findByUserAndFlashcard(userId, flashcardId) {
    const stmt = db.prepare(`
      SELECT * FROM user_notes 
      WHERE user_id = ? AND flashcard_id = ?
    `);
    return stmt.get(userId, flashcardId);
  }

  static delete(userId, flashcardId) {
    const stmt = db.prepare(`
      DELETE FROM user_notes 
      WHERE user_id = ? AND flashcard_id = ?
    `);
    return stmt.run(userId, flashcardId);
  }
}

module.exports = UserNote;
