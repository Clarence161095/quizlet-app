const { db } = require('../database/init');

class LearningProgress {
  static findByUserAndFlashcard(userId, flashcardId) {
    const stmt = db.prepare(`
      SELECT * FROM learning_progress 
      WHERE user_id = ? AND flashcard_id = ?
    `);
    return stmt.get(userId, flashcardId);
  }

  static createOrUpdate(userId, flashcardId, isCorrect) {
    const existing = this.findByUserAndFlashcard(userId, flashcardId);
    
    if (existing) {
      return this.updateProgress(existing, isCorrect);
    } else {
      return this.createProgress(userId, flashcardId, isCorrect);
    }
  }

  static createProgress(userId, flashcardId, isCorrect) {
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

    const stmt = db.prepare(`
      INSERT INTO learning_progress (
        user_id, flashcard_id, ease_factor, interval_days, 
        repetitions, next_review_date, last_review_date, consecutive_correct
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId, flashcardId, easeFactor, intervalDays,
      repetitions, nextReviewDate.toISOString(), now.toISOString(), consecutiveCorrect
    );

    return result.lastInsertRowid;
  }

  static updateProgress(progress, isCorrect) {
    const now = new Date();
    let { ease_factor, interval_days, repetitions, consecutive_correct, is_mastered } = progress;

    if (isCorrect) {
      consecutive_correct += 1;
      repetitions += 1;

      // SM-2 Algorithm with modifications
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
        interval_days = Math.round(interval_days * ease_factor);
      }

      ease_factor = ease_factor + 0.1; // Increase ease factor for correct answers
      if (ease_factor > 3.0) ease_factor = 3.0;

      // Mark as mastered after 7 consecutive correct answers
      if (consecutive_correct >= 7) {
        is_mastered = 1;
      }
    } else {
      // Reset on incorrect answer
      consecutive_correct = 0;
      repetitions = 0;
      interval_days = 0;
      ease_factor = Math.max(1.3, ease_factor - 0.2); // Decrease ease factor
      is_mastered = 0;
    }

    const nextReviewDate = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);

    const stmt = db.prepare(`
      UPDATE learning_progress
      SET ease_factor = ?, interval_days = ?, repetitions = ?,
          next_review_date = ?, last_review_date = ?, 
          consecutive_correct = ?, is_mastered = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND flashcard_id = ?
    `);

    stmt.run(
      ease_factor, interval_days, repetitions,
      nextReviewDate.toISOString(), now.toISOString(),
      consecutive_correct, is_mastered,
      progress.user_id, progress.flashcard_id
    );

    return this.findByUserAndFlashcard(progress.user_id, progress.flashcard_id);
  }

  static getDueFlashcards(userId, setId = null) {
    const now = new Date().toISOString();
    
    let query = `
      SELECT f.*, lp.next_review_date, lp.consecutive_correct, lp.is_mastered
      FROM flashcards f
      LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = ?
      WHERE (lp.next_review_date IS NULL OR lp.next_review_date <= ?)
    `;

    const params = [userId, now];

    if (setId) {
      query += ' AND f.set_id = ?';
      params.push(setId);
    }

    query += ' ORDER BY lp.is_mastered ASC, lp.next_review_date ASC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  static getDueFlashcardsInFolder(userId, folderId) {
    const now = new Date().toISOString();
    
    // Use junction table for many-to-many relationship
    const stmt = db.prepare(`
      SELECT f.*, lp.next_review_date, lp.consecutive_correct, lp.is_mastered
      FROM flashcards f
      INNER JOIN sets s ON f.set_id = s.id
      INNER JOIN folder_sets fs ON s.id = fs.set_id
      LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = ?
      WHERE fs.folder_id = ? AND (lp.next_review_date IS NULL OR lp.next_review_date <= ?)
      ORDER BY fs.added_at ASC, lp.is_mastered ASC, lp.next_review_date ASC
    `);

    return stmt.all(userId, folderId, now);
  }

  static getProgressStats(userId, setId = null) {
    let query = `
      SELECT 
        COUNT(DISTINCT f.id) as total,
        COUNT(DISTINCT CASE WHEN lp.is_mastered = 1 THEN f.id END) as mastered,
        COUNT(DISTINCT CASE WHEN lp.consecutive_correct > 0 THEN f.id END) as learning
      FROM flashcards f
      LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = ?
    `;

    const params = [userId];

    if (setId) {
      query += ' WHERE f.set_id = ?';
      params.push(setId);
    }

    const stmt = db.prepare(query);
    return stmt.get(...params);
  }

  static getProgressStatsForFolder(userId, folderId) {
    // Get stats for all flashcards in all sets within a folder (via junction table)
    const stmt = db.prepare(`
      SELECT 
        COUNT(DISTINCT f.id) as total,
        COUNT(DISTINCT CASE WHEN lp.is_mastered = 1 THEN f.id END) as mastered,
        COUNT(DISTINCT CASE WHEN lp.consecutive_correct > 0 AND lp.is_mastered = 0 THEN f.id END) as learning
      FROM flashcards f
      INNER JOIN sets s ON f.set_id = s.id
      INNER JOIN folder_sets fs ON s.id = fs.set_id
      LEFT JOIN learning_progress lp ON f.id = lp.flashcard_id AND lp.user_id = ?
      WHERE fs.folder_id = ?
    `);
    return stmt.get(userId, folderId);
  }
}

module.exports = LearningProgress;
