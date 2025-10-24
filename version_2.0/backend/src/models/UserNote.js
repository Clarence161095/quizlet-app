const { query, queryOne, queryAll } = require('../config/database');

/**
 * UserNote Model
 * 
 * Manages personal notes that users add to flashcards
 * Each user can have one note per flashcard
 */
class UserNote {
  /**
   * Find note by user and flashcard
   */
  static async findByUserAndFlashcard(userId, flashcardId) {
    return await queryOne(
      `SELECT * FROM user_notes 
       WHERE user_id = $1 AND flashcard_id = $2`,
      [userId, flashcardId]
    );
  }

  /**
   * Create or update a note
   */
  static async createOrUpdate(userId, flashcardId, content) {
    const existing = await this.findByUserAndFlashcard(userId, flashcardId);

    if (existing) {
      return await this.update(userId, flashcardId, content);
    } else {
      return await this.create(userId, flashcardId, content);
    }
  }

  /**
   * Create a new note
   */
  static async create(userId, flashcardId, content) {
    return await queryOne(
      `INSERT INTO user_notes (user_id, flashcard_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, flashcardId, content]
    );
  }

  /**
   * Update an existing note
   */
  static async update(userId, flashcardId, content) {
    return await queryOne(
      `UPDATE user_notes
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND flashcard_id = $3
       RETURNING *`,
      [content, userId, flashcardId]
    );
  }

  /**
   * Delete a note
   */
  static async delete(userId, flashcardId) {
    await query(
      'DELETE FROM user_notes WHERE user_id = $1 AND flashcard_id = $2',
      [userId, flashcardId]
    );
    return true;
  }

  /**
   * Get all notes by user
   */
  static async findAllByUser(userId) {
    return await queryAll(
      `SELECT un.*, f.word, f.definition, s.name as set_name
       FROM user_notes un
       INNER JOIN flashcards f ON un.flashcard_id = f.id
       INNER JOIN sets s ON f.set_id = s.id
       WHERE un.user_id = $1
       ORDER BY un.updated_at DESC`,
      [userId]
    );
  }

  /**
   * Get notes for flashcards in a set
   */
  static async findByUserAndSet(userId, setId) {
    return await queryAll(
      `SELECT un.*, f.word, f.definition
       FROM user_notes un
       INNER JOIN flashcards f ON un.flashcard_id = f.id
       WHERE un.user_id = $1 AND f.set_id = $2
       ORDER BY f.order_index ASC`,
      [userId, setId]
    );
  }

  /**
   * Count notes by user
   */
  static async countByUser(userId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM user_notes WHERE user_id = $1',
      [userId]
    );
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Delete all notes for flashcards in a set
   */
  static async deleteBySet(setId) {
    await query(
      `DELETE FROM user_notes 
       WHERE flashcard_id IN (SELECT id FROM flashcards WHERE set_id = $1)`,
      [setId]
    );
    return true;
  }

  /**
   * Delete all notes for a specific flashcard
   */
  static async deleteByFlashcard(flashcardId) {
    await query(
      'DELETE FROM user_notes WHERE flashcard_id = $1',
      [flashcardId]
    );
    return true;
  }
}

module.exports = UserNote;
