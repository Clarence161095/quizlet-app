const { query, queryOne, queryAll } = require('../config/database');

class Set {
  /**
   * Create new set
   */
  static async create(userId, name, description = null, folderId = null) {
    const result = await queryOne(
      `INSERT INTO sets (user_id, name, description, folder_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, description, folderId]
    );
    return result;
  }

  /**
   * Find set by ID
   */
  static async findById(id) {
    return await queryOne('SELECT * FROM sets WHERE id = $1', [id]);
  }

  /**
   * Find all sets by user ID
   */
  static async findByUserId(userId) {
    // Get sets with folder name (backward compatibility with folder_id)
    return await queryAll(
      `SELECT s.*, f.name as folder_name 
       FROM sets s
       LEFT JOIN folders f ON s.folder_id = f.id
       WHERE s.user_id = $1 
       ORDER BY s.created_at DESC`,
      [userId]
    );
  }

  /**
   * Find sets in a folder (many-to-many via folder_sets)
   */
  static async findByFolderId(folderId) {
    return await queryAll(
      `SELECT s.* FROM sets s
       INNER JOIN folder_sets fs ON s.id = fs.set_id
       WHERE fs.folder_id = $1
       ORDER BY fs.added_at DESC, s.created_at DESC`,
      [folderId]
    );
  }

  /**
   * Get folder names for a set (many-to-many)
   */
  static async getFolderNames(setId) {
    const folders = await queryAll(
      `SELECT f.name FROM folders f
       INNER JOIN folder_sets fs ON f.id = fs.folder_id
       WHERE fs.set_id = $1
       ORDER BY f.name ASC`,
      [setId]
    );
    
    if (folders.length === 0) {
      return 'No folder';
    }
    
    return folders.map(f => f.name).join(', ');
  }

  /**
   * Update set
   */
  static async update(id, name, description, folderId) {
    const result = await queryOne(
      `UPDATE sets 
       SET name = $1, 
           description = $2, 
           folder_id = $3, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, description, folderId, id]
    );
    return result;
  }

  /**
   * Delete set
   */
  static async delete(id) {
    await query('DELETE FROM sets WHERE id = $1', [id]);
    return true;
  }

  /**
   * Get flashcard count for a set
   */
  static async getFlashcardCount(setId) {
    const result = await queryOne(
      'SELECT COUNT(*) as count FROM flashcards WHERE set_id = $1',
      [setId]
    );
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Get all flashcards in a set (ordered by order_index)
   */
  static async getFlashcards(setId) {
    return await queryAll(
      'SELECT * FROM flashcards WHERE set_id = $1 ORDER BY order_index ASC, id ASC',
      [setId]
    );
  }

  /**
   * Clone set from source (for sharing)
   */
  static async clone(sourceSetId, newUserId, allowExport = 1) {
    // Get source set
    const sourceSet = await this.findById(sourceSetId);
    if (!sourceSet) {
      throw new Error('Source set not found');
    }

    // Create new set
    const newSet = await queryOne(
      `INSERT INTO sets (user_id, name, description, source_set_id, allow_export)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [newUserId, sourceSet.name, sourceSet.description, sourceSetId, allowExport]
    );

    // Clone all flashcards
    await query(
      `INSERT INTO flashcards (set_id, word, definition, term_image, definition_image, is_starred, order_index)
       SELECT $1, word, definition, term_image, definition_image, 0, order_index
       FROM flashcards
       WHERE set_id = $2
       ORDER BY order_index ASC, id ASC`,
      [newSet.id, sourceSetId]
    );

    return newSet;
  }

  /**
   * Update set from source (for cloned sets)
   */
  static async updateFromSource(setId) {
    const set = await this.findById(setId);
    if (!set || !set.source_set_id) {
      throw new Error('This set is not cloned from a source');
    }

    const sourceSet = await this.findById(set.source_set_id);
    if (!sourceSet) {
      throw new Error('Source set not found');
    }

    // Update set metadata
    await query(
      `UPDATE sets 
       SET name = $1, 
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [sourceSet.name, sourceSet.description, setId]
    );

    // Get user's learning progress to preserve
    const progressMap = {};
    const progress = await queryAll(
      `SELECT flashcard_id, word, definition 
       FROM learning_progress lp
       INNER JOIN flashcards f ON lp.flashcard_id = f.id
       WHERE f.set_id = $1`,
      [setId]
    );

    // Map old flashcards by word+definition
    progress.forEach(p => {
      const key = `${p.word}|||${p.definition}`;
      progressMap[key] = p.flashcard_id;
    });

    // Delete old flashcards (but progress will be preserved via mapping)
    await query('DELETE FROM flashcards WHERE set_id = $1', [setId]);

    // Clone flashcards from source
    const sourceFlashcards = await this.getFlashcards(set.source_set_id);
    
    for (const sf of sourceFlashcards) {
      const result = await queryOne(
        `INSERT INTO flashcards (set_id, word, definition, term_image, definition_image, is_starred, order_index)
         VALUES ($1, $2, $3, $4, $5, 0, $6)
         RETURNING id`,
        [setId, sf.word, sf.definition, sf.term_image, sf.definition_image, sf.order_index]
      );

      // Re-link learning progress if exists
      const key = `${sf.word}|||${sf.definition}`;
      const oldFlashcardId = progressMap[key];
      
      if (oldFlashcardId) {
        await query(
          `UPDATE learning_progress 
           SET flashcard_id = $1 
           WHERE flashcard_id = $2`,
          [result.id, oldFlashcardId]
        );
      }
    }

    return true;
  }
}

module.exports = Set;
