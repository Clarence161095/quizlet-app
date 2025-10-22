const { db } = require('../database/init');

class User {
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static create(username, hashedPassword, email = null, isAdmin = 0) {
    const stmt = db.prepare(`
      INSERT INTO users (username, password, email, is_admin)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(username, hashedPassword, email, isAdmin);
    return result.lastInsertRowid;
  }

  static update(id, data) {
    const fields = [];
    const values = [];

    if (data.password !== undefined) {
      fields.push('password = ?');
      values.push(data.password);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active);
    }
    if (data.must_change_password !== undefined) {
      fields.push('must_change_password = ?');
      values.push(data.must_change_password);
    }
    if (data.first_login !== undefined) {
      fields.push('first_login = ?');
      values.push(data.first_login);
    }
    if (data.mfa_secret !== undefined) {
      fields.push('mfa_secret = ?');
      values.push(data.mfa_secret);
    }
    if (data.mfa_enabled !== undefined) {
      fields.push('mfa_enabled = ?');
      values.push(data.mfa_enabled);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `);
    return stmt.run(...values);
  }

  static getAll() {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = User;
