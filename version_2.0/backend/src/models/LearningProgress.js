const { query, queryOne, queryAll } = require('../config/database');

/**
 * LearningProgress Model
 * 
 * CRITICAL: This implements the Spaced Repetition Algorithm (Modified SM-2)
 * 
 * Algorithm Details:
 * - Intervals: 1, 3, 7, 15, 30, 60 days, then interval × ease_factor
 * - Ease Factor: 2.5 default, +0.1 correct (max 3.0), -0.2 incorrect (min 1.3)
 * - Mastery: 4 consecutive correct = PERMANENT mastered status
 * - Reset: Incorrect answer resets consecutive_correct and repetitions to 0,
 *          BUT is_mastered stays 1 if already mastered (KHÔNG BAO GIỜ RESET)
 */
class LearningProgress {
  /**
   * Find learning progress by user and flashcard
   */
  static async findByUserAndFlashcard(userId, flashcardId) {
    return await queryOne(
      `SELECT * FROM learning_progress 
       WHERE user_id = $1 AND flashcard_id = $2`,
      [userId, flashcardId]
    );
  }

  /**
   * Create or update learning progress
   */
  static async createOrUpdate(userId, flashcardId, isCorrect) {
    const existing = await this.findByUserAndFlashcard(userId, flashcardId);
    
    if (existing) {
      return await this.updateProgress(existing, isCorrect);
    } else {
      return await this.createProgress(userId, flashcardId, isCorrect);
    }
  }

  /**
   * Create new learning progress
   */
  static async createProgress(userId, flashcardId, isCorrect) {
    const now = new Date();
    let intervalDays = 0;
    let nextReviewDate = null;
    let consecutiveCorrect = 0;
    let easeFactor = 2.5;
    let repetitions = 0;

    if (isCorrect) {
      consecutiveCorrect = 1;
      intervalDays = 1;
      repetitions = 1;
      nextReviewDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    } else {
      nextReviewDate = now; // Review again immediately
    }

    const result = await queryOne(
      `INSERT INTO learning_progress (
        user_id, flashcard_id, ease_factor, interval_days, 
        repetitions, next_review_date, last_review_date, consecutive_correct
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId, flashcardId, easeFactor, intervalDays,
        repetitions, nextReviewDate.toISOString(), now.toISOString(), consecutiveCorrect
      ]
    );

    return result;
  }

  /**
   * Update existing learning progress (CRITICAL ALGORITHM)
   */
  static async updateProgress(progress, isCorrect) {
    const now = new Date();
    let { ease_factor, interval_days, repetitions, consecutive_correct, is_mastered } = progress;

    if (isCorrect) {
      // Correct answer
      consecutive_correct += 1;
      repetitions += 1;

      // Modified SM-2 Algorithm - Fixed intervals for first 6 repetitions
      if (repetitions === 1) {
        interval_days = 1;
      } else if (repetitions === 2) {
        interval_days = 3;
      } else if (repetitions === 3) {
        interval_days = 7;
      } else if (repetitions === 4) {
        interval_days = 15;
      } else if (repetitions === 5) {
        interval_days = 30;
      } else if (repetitions === 6) {
        interval_days = 60;
      } else {
        // After 6th repetition, use ease factor
        interval_days = Math.round(interval_days * ease_factor);
      }

      // Increase ease factor for correct answers
      ease_factor = ease_factor + 0.1;
      if (ease_factor > 3.0) ease_factor = 3.0;

      // Mark as mastered after 4 consecutive correct answers
      // KHÔNG BAO GIỜ RESET - Once mastered, always mastered
      if (consecutive_correct >= 4) {
        is_mastered = 1;
      }
    } else {
      // Incorrect answer
      // Reset consecutive_correct và repetitions
      consecutive_correct = 0;
      repetitions = 0;
      interval_days = 0;
      
      // Decrease ease factor
      ease_factor = Math.max(1.3, ease_factor - 0.2);
      
      // QUAN TRỌNG: KHÔNG reset is_mastered
      // Nếu đã mastered thì vẫn giữ trạng thái đó
      // is_mastered giữ nguyên giá trị hiện tại
    }

    const nextReviewDate = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);

    const result = await queryOne(
      `UPDATE learning_progress
       SET ease_factor = $1, 
           interval_days = $2, 
           repetitions = $3,
           next_review_date = $4, 
           last_review_date = $5, 
           consecutive_correct = $6, 
           is_mastered = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $8 AND flashcard_id = $9
       RETURNING *`,
      [
        ease_factor, interval_days, repetitions,
        nextReviewDate.toISOString(), now.toISOString(),
        consecutive_correct, is_mastered,
        progress.user_id, progress.flashcard_id
      ]
    );

    return result;
  }

  /**
   * Get due flashcards for review (spaced repetition)
   */
  static async getDueFlashcards(userId, setId = null) {
    const now = new Date().toISOString();
    
    let queryText = `
      SELECT f.*, 
             lp.next_review_date, 
             lp.consecutive_correct, 
             lp.is_mastered
      FROM flashcards f
      LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = $1
      WHERE (lp.next_review_date IS NULL OR lp.next_review_date <= $2)
    `;

    const params = [userId, now];

    if (setId) {
      queryText += ' AND f.set_id = $3';
      params.push(setId);
    }

    // Order: Learning cards first (is_mastered = 0), then mastered cards
    // Within each group, order by next_review_date (oldest first)
    queryText += ' ORDER BY lp.is_mastered ASC, lp.next_review_date ASC';

    return await queryAll(queryText, params);
  }

  /**
   * Get due flashcards in folder
   */
  static async getDueFlashcardsInFolder(userId, folderId) {
    const now = new Date().toISOString();
    
    return await queryAll(
      `SELECT f.*, 
              lp.next_review_date, 
              lp.consecutive_correct, 
              lp.is_mastered
       FROM flashcards f
       INNER JOIN sets s ON f.set_id = s.id
       INNER JOIN folder_sets fs ON s.id = fs.set_id
       LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = $1
       WHERE fs.folder_id = $2 
         AND (lp.next_review_date IS NULL OR lp.next_review_date <= $3)
       ORDER BY fs.added_at ASC, lp.is_mastered ASC, lp.next_review_date ASC`,
      [userId, folderId, now]
    );
  }

  /**
   * Get progress statistics for a set
   */
  static async getProgressStats(userId, setId = null) {
    let queryText = `
      SELECT 
        COUNT(DISTINCT f.id) as total,
        COUNT(DISTINCT CASE WHEN lp.flashcard_id IS NOT NULL THEN f.id END) as learned,
        COUNT(DISTINCT CASE WHEN lp.flashcard_id IS NOT NULL AND lp.is_mastered = 0 THEN f.id END) as learning
      FROM flashcards f
      LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = $1
    `;

    const params = [userId];

    if (setId) {
      queryText += ' WHERE f.set_id = $2';
      params.push(setId);
    }

    const result = await queryOne(queryText, params);
    
    return {
      total: result ? parseInt(result.total) : 0,
      learned: result ? parseInt(result.learned) : 0,
      learning: result ? parseInt(result.learning) : 0,
      new: result ? parseInt(result.total) - parseInt(result.learned) : 0
    };
  }

  /**
   * Get progress statistics for a folder
   */
  static async getProgressStatsForFolder(userId, folderId) {
    const result = await queryOne(
      `SELECT 
        COUNT(DISTINCT f.id) as total,
        COUNT(DISTINCT CASE WHEN lp.flashcard_id IS NOT NULL THEN f.id END) as learned,
        COUNT(DISTINCT CASE WHEN lp.flashcard_id IS NOT NULL AND lp.is_mastered = 0 THEN f.id END) as learning
       FROM flashcards f
       INNER JOIN sets s ON f.set_id = s.id
       INNER JOIN folder_sets fs ON s.id = fs.set_id
       LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = $1
       WHERE fs.folder_id = $2`,
      [userId, folderId]
    );

    return {
      total: result ? parseInt(result.total) : 0,
      learned: result ? parseInt(result.learned) : 0,
      learning: result ? parseInt(result.learning) : 0,
      new: result ? parseInt(result.total) - parseInt(result.learned) : 0
    };
  }

  /**
   * Reset progress for a flashcard
   */
  static async resetProgress(userId, flashcardId) {
    await query(
      'DELETE FROM learning_progress WHERE user_id = $1 AND flashcard_id = $2',
      [userId, flashcardId]
    );
    return true;
  }

  /**
   * Get all learning progress for a user
   */
  static async getAllByUser(userId) {
    return await queryAll(
      `SELECT lp.*, f.word, f.definition, s.name as set_name
       FROM learning_progress lp
       INNER JOIN flashcards f ON lp.flashcard_id = f.id
       INNER JOIN sets s ON f.set_id = s.id
       WHERE lp.user_id = $1
       ORDER BY lp.last_review_date DESC`,
      [userId]
    );
  }
}

module.exports = LearningProgress;
