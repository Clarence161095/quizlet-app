# Database Module

## Overview

This folder contains database initialization and schema management for the Qi Learning App.

## Files

- **init.js**: Main database initialization script with complete schema
- **MIGRATION.md**: Comprehensive migration guide and schema documentation

## Quick Start

### Initialize Database

```bash
npm run init-db
```

This will:
1. Create `data/quizlet.db` if it doesn't exist
2. Create all required tables
3. Create default admin user (username: `admin`, password: `admin123`)

### Database Location

- **Main Database**: `data/quizlet.db`
- **Session Storage**: `data/sessions.db` (created automatically)

## Database Technology

- **Engine**: SQLite 3
- **Library**: better-sqlite3 (synchronous API)
- **Foreign Keys**: Enabled by default

## Schema Version

Current version: **1.0.0**

See [MIGRATION.md](./MIGRATION.md) for complete schema documentation.

## Usage in Code

### Import Database

```javascript
const { db } = require('./database/init');
```

### Query Examples

```javascript
// Synchronous queries (better-sqlite3)
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId);

// Multiple results
const allUsers = db.prepare('SELECT * FROM users').all();

// Insert/Update
const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
const newId = result.lastInsertRowid;
```

### Transactions

```javascript
const insertMany = db.transaction((items) => {
  const stmt = db.prepare('INSERT INTO flashcards (set_id, word, definition) VALUES (?, ?, ?)');
  for (const item of items) {
    stmt.run(item.setId, item.word, item.definition);
  }
});

insertMany(flashcardArray);
```

## Important Notes

⚠️ **Synchronous API Only**
- Do NOT use `await` with database queries
- All queries are synchronous (blocking)
- This is intentional for simplicity and reliability

⚠️ **Foreign Keys**
- Always enabled via `db.pragma('foreign_keys = ON')`
- Cascade deletes are configured in schema
- Check MIGRATION.md for cascade behavior

⚠️ **Prepared Statements**
- Always use `?` placeholders for values
- Never concatenate user input into SQL strings
- Protects against SQL injection

## Troubleshooting

### Database Locked

If you get "database is locked" errors:
- Ensure only one server instance is running
- Close any SQLite browser tools
- Restart the server

### Reset Database

```bash
rm -f data/quizlet.db
npm run init-db
```

This creates a fresh database with default admin user.

## Migration

See [MIGRATION.md](./MIGRATION.md) for:
- Complete schema documentation
- Migration from development to v1.0.0
- Backup strategies
- Indexing recommendations
