const { query, queryOne, queryAll } = require('../config/database');

class Flashcard {
  /**
   * Create new flashcard
   */
  static async create(setId, word, definition, termImage = null, definitionImage = null, orderIndex = 0) {
    const result = await queryOne(
      `INSERT INTO flashcards (set_id, word, definition, term_image, definition_image, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [setId, word, definition, termImage, definitionImage, orderIndex]
    );
    return result;
  }

  /**
   * Find flashcard by ID
   */
  static async findById(id) {
    return await queryOne('SELECT * FROM flashcards WHERE id = $1', [id]);
  }

  /**
   * Find all flashcards by set ID
   */
  static async findBySetId(setId) {
    return await queryAll(
      'SELECT * FROM flashcards WHERE set_id = $1 ORDER BY order_index ASC, id ASC',
      [setId]
    );
  }

  /**
   * Update flashcard
   */
  static async update(id, word, definition, termImage = null, definitionImage = null) {
    const result = await queryOne(
      `UPDATE flashcards 
       SET word = $1, 
           definition = $2, 
           term_image = $3,
           definition_image = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [word, definition, termImage, definitionImage, id]
    );
    return result;
  }

  /**
   * Delete flashcard
   */
  static async delete(id) {
    await query('DELETE FROM flashcards WHERE id = $1', [id]);
    return true;
  }

  /**
   * Toggle star status
   */
  static async toggleStar(id) {
    const flashcard = await this.findById(id);
    if (!flashcard) {
      throw new Error('Flashcard not found');
    }

    const newStarValue = flashcard.is_starred ? 0 : 1;
    
    await query(
      `UPDATE flashcards 
       SET is_starred = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newStarValue, id]
    );

    return { is_starred: newStarValue };
  }

  /**
   * Batch create flashcards
   */
  static async batchCreate(setId, flashcardsData) {
    const created = [];
    
    for (let i = 0; i < flashcardsData.length; i++) {
      const { word, definition, term_image, definition_image } = flashcardsData[i];
      const flashcard = await this.create(
        setId, 
        word, 
        definition, 
        term_image || null, 
        definition_image || null, 
        i // order_index
      );
      created.push(flashcard);
    }

    return created;
  }

  /**
   * Update order indices for flashcards
   */
  static async updateOrder(flashcardIds) {
    // flashcardIds is an array of IDs in the desired order
    for (let i = 0; i < flashcardIds.length; i++) {
      await query(
        `UPDATE flashcards 
         SET order_index = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [i, flashcardIds[i]]
      );
    }
    return true;
  }

  /**
   * Get flashcard with user's note and learning progress
   */
  static async getWithUserData(flashcardId, userId) {
    const result = await queryOne(
      `SELECT 
        f.*,
        un.note as user_note,
        lp.ease_factor,
        lp.interval_days,
        lp.repetitions,
        lp.next_review_date,
        lp.last_review_date,
        lp.consecutive_correct,
        lp.is_mastered,
        CASE WHEN lp.id IS NOT NULL THEN 1 ELSE 0 END as has_progress
       FROM flashcards f
       LEFT JOIN user_notes un ON f.id = un.flashcard_id AND un.user_id = $2
       LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = $2
       WHERE f.id = $1`,
      [flashcardId, userId]
    );
    return result;
  }

  /**
   * Get all flashcards in set with user data
   */
  static async getAllWithUserData(setId, userId) {
    return await queryAll(
      `SELECT 
        f.*,
        un.note as user_note,
        lp.ease_factor,
        lp.interval_days,
        lp.repetitions,
        lp.next_review_date,
        lp.last_review_date,
        lp.consecutive_correct,
        lp.is_mastered,
        CASE WHEN lp.id IS NOT NULL THEN 1 ELSE 0 END as has_progress
       FROM flashcards f
       LEFT JOIN user_notes un ON f.id = un.flashcard_id AND un.user_id = $2
       LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = $2
       WHERE f.set_id = $1
       ORDER BY f.order_index ASC, f.id ASC`,
      [setId, userId]
    );
  }

  /**
   * Get starred flashcards in set
   */
  static async getStarred(setId) {
    return await queryAll(
      `SELECT * FROM flashcards 
       WHERE set_id = $1 AND is_starred = 1
       ORDER BY order_index ASC, id ASC`,
      [setId]
    );
  }

  /**
   * Get flashcard count by set
   */
  static async countBySet(setId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM flashcards WHERE set_id = $1',
      [setId]
    );
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Delete all flashcards in a set
   */
  static async deleteBySet(setId) {
    await query('DELETE FROM flashcards WHERE set_id = $1', [setId]);
    return true;
  }
}

module.exports = Flashcard;
