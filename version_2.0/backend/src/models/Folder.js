const { query, queryOne, queryAll } = require('../config/database');

class Folder {
  /**
   * Create new folder
   */
  static async create(userId, name, description = null) {
    const result = await queryOne(
      `INSERT INTO folders (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, name, description]
    );
    return result;
  }

  /**
   * Find folder by ID
   */
  static async findById(id) {
    return await queryOne('SELECT * FROM folders WHERE id = $1', [id]);
  }

  /**
   * Find all folders by user ID
   */
  static async findByUserId(userId) {
    return await queryAll(
      `SELECT * FROM folders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
  }

  /**
   * Update folder
   */
  static async update(id, name, description) {
    const result = await queryOne(
      `UPDATE folders 
       SET name = $1, 
           description = $2, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [name, description, id]
    );
    return result;
  }

  /**
   * Delete folder
   */
  static async delete(id) {
    await query('DELETE FROM folders WHERE id = $1', [id]);
    return true;
  }

  /**
   * Get all sets in a folder (many-to-many)
   */
  static async getSetsInFolder(folderId) {
    return await queryAll(
      `SELECT s.*, fs.added_at 
       FROM sets s
       INNER JOIN folder_sets fs ON s.id = fs.set_id
       WHERE fs.folder_id = $1
       ORDER BY fs.added_at DESC, s.created_at DESC`,
      [folderId]
    );
  }

  /**
   * Get all flashcards in a folder (from all sets in folder)
   */
  static async getFlashcardsInFolder(folderId) {
    return await queryAll(
      `SELECT f.* 
       FROM flashcards f
       INNER JOIN sets s ON f.set_id = s.id
       INNER JOIN folder_sets fs ON s.id = fs.set_id
       WHERE fs.folder_id = $1
       ORDER BY fs.added_at ASC, f.order_index ASC, f.id ASC`,
      [folderId]
    );
  }

  /**
   * Add set to folder (many-to-many)
   */
  static async addSetToFolder(folderId, setId) {
    // Check if already exists
    const existing = await queryOne(
      `SELECT * FROM folder_sets 
       WHERE folder_id = $1 AND set_id = $2`,
      [folderId, setId]
    );

    if (existing) {
      return false; // Already in folder
    }

    await query(
      `INSERT INTO folder_sets (folder_id, set_id)
       VALUES ($1, $2)`,
      [folderId, setId]
    );

    return true;
  }

  /**
   * Remove set from folder (many-to-many)
   */
  static async removeSetFromFolder(folderId, setId) {
    await query(
      `DELETE FROM folder_sets 
       WHERE folder_id = $1 AND set_id = $2`,
      [folderId, setId]
    );
    return true;
  }

  /**
   * Get all folders that contain a specific set
   */
  static async getFoldersForSet(setId) {
    return await queryAll(
      `SELECT f.* 
       FROM folders f
       INNER JOIN folder_sets fs ON f.id = fs.folder_id
       WHERE fs.set_id = $1
       ORDER BY f.name ASC`,
      [setId]
    );
  }

  /**
   * Get set count in folder
   */
  static async getSetCount(folderId) {
    const result = await queryOne(
      `SELECT COUNT(*) as count 
       FROM folder_sets 
       WHERE folder_id = $1`,
      [folderId]
    );
    return result ? parseInt(result.count) : 0;
  }

  /**
   * Clone folder from source (for sharing)
   */
  static async clone(sourceFolderId, newUserId, allowExport = 1) {
    // Get source folder
    const sourceFolder = await this.findById(sourceFolderId);
    if (!sourceFolder) {
      throw new Error('Source folder not found');
    }

    // Create new folder
    const newFolder = await queryOne(
      `INSERT INTO folders (user_id, name, description, source_folder_id, allow_export)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [newUserId, sourceFolder.name, sourceFolder.description, sourceFolderId, allowExport]
    );

    // Get all sets in source folder
    const sourceSets = await this.getSetsInFolder(sourceFolderId);

    // Clone each set and add to new folder
    const Set = require('./Set');
    for (const set of sourceSets) {
      const newSet = await Set.clone(set.id, newUserId, allowExport);
      await this.addSetToFolder(newFolder.id, newSet.id);
    }

    return newFolder;
  }

  /**
   * Update folder from source (for cloned folders)
   */
  static async updateFromSource(folderId) {
    const folder = await this.findById(folderId);
    if (!folder || !folder.source_folder_id) {
      throw new Error('This folder is not cloned from a source');
    }

    const sourceFolder = await this.findById(folder.source_folder_id);
    if (!sourceFolder) {
      throw new Error('Source folder not found');
    }

    // Update folder metadata
    await query(
      `UPDATE folders 
       SET name = $1, 
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [sourceFolder.name, sourceFolder.description, folderId]
    );

    // Get source sets
    const sourceSets = await this.getSetsInFolder(folder.source_folder_id);
    const currentSets = await this.getSetsInFolder(folderId);

    // Update existing cloned sets
    const Set = require('./Set');
    for (const currentSet of currentSets) {
      // Find matching source set
      const matchingSource = sourceSets.find(ss => {
        // Match by source_set_id or by name if not found
        return currentSet.source_set_id === ss.id || currentSet.name === ss.name;
      });

      if (matchingSource && currentSet.source_set_id) {
        // Update from source
        await Set.updateFromSource(currentSet.id);
      }
    }

    // Check for new sets in source that don't exist in clone
    for (const sourceSet of sourceSets) {
      const exists = currentSets.find(cs => 
        cs.source_set_id === sourceSet.id || cs.name === sourceSet.name
      );

      if (!exists) {
        // Clone new set and add to folder
        const newSet = await Set.clone(sourceSet.id, folder.user_id, folder.allow_export);
        await this.addSetToFolder(folderId, newSet.id);
      }
    }

    return true;
  }
}

module.exports = Folder;
