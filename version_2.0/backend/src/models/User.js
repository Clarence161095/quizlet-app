const { query, queryOne, queryAll } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Find user by ID
   */
  static async findById(id) {
    return await queryOne('SELECT * FROM users WHERE id = $1', [id]);
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    return await queryOne('SELECT * FROM users WHERE username = $1', [username]);
  }

  /**
   * Get all users (admin only)
   */
  static async getAll() {
    return await queryAll('SELECT id, username, email, is_admin, is_active, created_at FROM users ORDER BY created_at DESC');
  }

  /**
   * Create new user
   */
  static async create(username, password, email = null, isAdmin = 0) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await queryOne(
      `INSERT INTO users (username, password, email, is_admin, is_active)
       VALUES ($1, $2, $3, $4, 1)
       RETURNING *`,
      [username, hashedPassword, email, isAdmin]
    );
    return result;
  }

  /**
   * Update user
   */
  static async update(id, data) {
    const { username, email, is_admin, is_active } = data;
    const result = await queryOne(
      `UPDATE users 
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           is_admin = COALESCE($3, is_admin),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [username, email, is_admin, is_active, id]
    );
    return result;
  }

  /**
   * Update password
   */
  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE users 
       SET password = $1,
           must_change_password = 0,
           first_login = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, id]
    );
    return true;
  }

  /**
   * Delete user
   */
  static async delete(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
    return true;
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Setup MFA
   */
  static async setupMFA(id, mfaSecret) {
    await query(
      `UPDATE users 
       SET mfa_secret = $1,
           mfa_enabled = 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [mfaSecret, id]
    );
    return true;
  }

  /**
   * Disable MFA
   */
  static async disableMFA(id) {
    await query(
      `UPDATE users 
       SET mfa_secret = NULL,
           mfa_enabled = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
    return true;
  }

  /**
   * Mark first login as completed
   */
  static async markFirstLoginComplete(id) {
    await query(
      `UPDATE users 
       SET first_login = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
    return true;
  }
}

module.exports = User;
