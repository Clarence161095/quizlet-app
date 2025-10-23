# Database Migration Guide

## Overview

This document describes the database schema and migration process for the Qi Learning App.

## Database Technology

- **Engine**: SQLite 3 (via better-sqlite3)
- **Location**: `data/quizlet.db`
- **Session Storage**: `data/sessions.db`

## Schema Version: 1.0.0

### Complete Schema

The application uses the following tables:

#### 1. Users Table
Stores user accounts and authentication data.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,              -- bcrypt hashed
  email TEXT,
  is_admin INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  must_change_password INTEGER DEFAULT 0,
  first_login INTEGER DEFAULT 1,
  mfa_secret TEXT,                     -- Speakeasy TOTP secret
  mfa_enabled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Folders Table
Organizes sets into folders (one user can have many folders).

```sql
CREATE TABLE folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_folder_id INTEGER DEFAULT NULL,  -- For shared folders (clone tracking)
  allow_export INTEGER DEFAULT 1,         -- Export permission
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
```

#### 3. Sets Table
Contains flashcard sets (one user can have many sets).

```sql
CREATE TABLE sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_id INTEGER,                      -- Deprecated: kept for backward compatibility
  name TEXT NOT NULL,
  description TEXT,
  source_set_id INTEGER DEFAULT NULL,     -- For shared sets (clone tracking)
  allow_export INTEGER DEFAULT 1,         -- Export permission
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
  FOREIGN KEY (source_set_id) REFERENCES sets(id) ON DELETE SET NULL
);
```

#### 4. Folder-Sets Junction Table
Many-to-many relationship between folders and sets (v1.0.0+).

```sql
CREATE TABLE folder_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id INTEGER NOT NULL,
  set_id INTEGER NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
  UNIQUE(folder_id, set_id)
);
```

#### 5. Flashcards Table
Individual flashcards within sets.

```sql
CREATE TABLE flashcards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  set_id INTEGER NOT NULL,
  word TEXT NOT NULL,                    -- Question/Term
  definition TEXT NOT NULL,              -- Answer/Definition
  term_image TEXT,                       -- Reserved for future use
  definition_image TEXT,                 -- Reserved for future use
  is_starred INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE
);
```

#### 6. User Notes Table
Personal notes for flashcards (one note per user per flashcard).

```sql
CREATE TABLE user_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  flashcard_id INTEGER NOT NULL,
  note TEXT,                             -- Markdown supported
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
  UNIQUE(user_id, flashcard_id)
);
```

#### 7. Learning Progress Table
Tracks spaced repetition progress (SM-2 algorithm).

```sql
CREATE TABLE learning_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  flashcard_id INTEGER NOT NULL,
  ease_factor REAL DEFAULT 2.5,          -- SM-2: difficulty multiplier
  interval_days INTEGER DEFAULT 0,       -- Days until next review
  repetitions INTEGER DEFAULT 0,         -- Total review count
  next_review_date DATETIME,             -- When card is due
  last_review_date DATETIME,
  consecutive_correct INTEGER DEFAULT 0, -- Streak counter
  is_mastered INTEGER DEFAULT 0,         -- 7+ consecutive correct
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
  UNIQUE(user_id, flashcard_id)
);
```

#### 8. Study Sessions Table
Tracks study session metadata.

```sql
CREATE TABLE study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  set_id INTEGER,
  folder_id INTEGER,
  session_type TEXT NOT NULL,            -- 'long_term', 'random_starred', 'random_all'
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE SET NULL,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
```

#### 9. Study Answers Table
Individual answers during study sessions.

```sql
CREATE TABLE study_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  flashcard_id INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);
```

#### 10. Set Shares Table
Sharing sets between users (clone-based).

```sql
CREATE TABLE set_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  set_id INTEGER NOT NULL,
  shared_by_user_id INTEGER NOT NULL,
  shared_with_user_id INTEGER NOT NULL,
  is_accepted INTEGER DEFAULT 0,
  share_token TEXT UNIQUE NOT NULL,
  allow_export INTEGER DEFAULT 1,        -- Can recipient export?
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(set_id, shared_with_user_id)
);
```

#### 11. Folder Shares Table
Sharing folders between users (clone-based).

```sql
CREATE TABLE folder_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id INTEGER NOT NULL,
  shared_by_user_id INTEGER NOT NULL,
  shared_with_user_id INTEGER NOT NULL,
  is_accepted INTEGER DEFAULT 0,
  share_token TEXT UNIQUE NOT NULL,
  allow_export INTEGER DEFAULT 1,        -- Can recipient export?
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(folder_id, shared_with_user_id)
);
```

## Database Relationships

```
users (1) ──┬──> (many) folders
            ├──> (many) sets
            ├──> (many) user_notes
            └──> (many) learning_progress

folders (many) <──> (many) sets  [via folder_sets junction table]

sets (1) ────> (many) flashcards

flashcards (1) ──┬──> (many) user_notes
                 └──> (many) learning_progress
```

## Migration from Development to v1.0.0

### For New Installations

Simply run:
```bash
npm run init-db
```

This creates all tables with the complete schema.

### For Existing Installations (Development → v1.0.0)

The v1.0.0 `init.js` includes all schema additions automatically:

1. **Folder-Sets Many-to-Many**: `folder_sets` junction table
2. **Source Tracking**: `source_set_id`, `source_folder_id` columns
3. **Export Permissions**: `allow_export` columns in sets, folders, and shares

#### Manual Migration (if needed)

If you have an existing database from development, you have two options:

**Option 1: Fresh Start (Recommended for development)**
```bash
# Backup existing data
cp data/quizlet.db data/quizlet.db.backup

# Reinitialize
npm run init-db
```

**Option 2: Keep Existing Data**

Run the following SQL statements directly on your database:

```sql
-- Add folder_sets junction table
CREATE TABLE IF NOT EXISTS folder_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id INTEGER NOT NULL,
  set_id INTEGER NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
  UNIQUE(folder_id, set_id)
);

-- Migrate existing folder relationships
INSERT INTO folder_sets (folder_id, set_id)
SELECT folder_id, id FROM sets WHERE folder_id IS NOT NULL;

-- Add source tracking columns
ALTER TABLE sets ADD COLUMN source_set_id INTEGER DEFAULT NULL;
ALTER TABLE folders ADD COLUMN source_folder_id INTEGER DEFAULT NULL;

-- Add export permission columns
ALTER TABLE sets ADD COLUMN allow_export INTEGER DEFAULT 1;
ALTER TABLE folders ADD COLUMN allow_export INTEGER DEFAULT 1;
ALTER TABLE set_shares ADD COLUMN allow_export INTEGER DEFAULT 1;
ALTER TABLE folder_shares ADD COLUMN allow_export INTEGER DEFAULT 1;
```

## Database Access Patterns

### Synchronous API

This app uses **synchronous** `better-sqlite3` API (NOT async/await):

```javascript
// CORRECT ✓
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId);

// WRONG ✗
const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
```

### Prepared Statements

Always use prepared statements for SQL injection protection:

```javascript
// CORRECT ✓
const stmt = db.prepare('SELECT * FROM sets WHERE user_id = ?');
const sets = stmt.all(userId);

// WRONG ✗ (vulnerable to SQL injection)
const sets = db.prepare(`SELECT * FROM sets WHERE user_id = ${userId}`).all();
```

### Transactions

For multiple related operations:

```javascript
const insertMany = db.transaction((items) => {
  const stmt = db.prepare('INSERT INTO flashcards (set_id, word, definition) VALUES (?, ?, ?)');
  for (const item of items) {
    stmt.run(item.setId, item.word, item.definition);
  }
});

insertMany(flashcardArray);
```

## Foreign Key Behavior

- **ON DELETE CASCADE**: Child records are deleted when parent is deleted
  - Users → Folders, Sets, Notes, Progress
  - Sets → Flashcards
  - Folders → folder_sets entries
  
- **ON DELETE SET NULL**: Foreign key is set to NULL when parent is deleted
  - Folders → Sets (sets.folder_id becomes NULL)
  - Source tracking (source_set_id, source_folder_id)

## Indexing Strategy

The app relies on automatic indexes created by:
- PRIMARY KEY constraints
- UNIQUE constraints
- FOREIGN KEY constraints

For production scale, consider adding:
```sql
CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_next_review ON learning_progress(next_review_date);
CREATE INDEX idx_folder_sets_folder_id ON folder_sets(folder_id);
CREATE INDEX idx_folder_sets_set_id ON folder_sets(set_id);
```

## Backup Strategy

### Development
```bash
cp data/quizlet.db data/quizlet.db.backup
```

### Production (EC2)
```bash
# Daily backup via cron
0 2 * * * cp /path/to/app/data/quizlet.db /path/to/backups/quizlet-$(date +\%Y\%m\%d).db

# Keep last 7 days
find /path/to/backups -name "quizlet-*.db" -mtime +7 -delete
```

## Troubleshooting

### Database Locked Error
SQLite can't handle concurrent writes. Ensure:
- Only one server instance is running
- Use transactions for bulk operations
- Set `busy_timeout` pragma if needed

### Foreign Key Constraint Failed
Enable foreign key checking:
```javascript
db.pragma('foreign_keys = ON');
```

### Recreate Database from Scratch
```bash
rm -f data/quizlet.db data/sessions.db
npm run init-db
```

## Future Schema Changes

When adding new features, update this file with:
1. New table/column definitions
2. Migration SQL statements
3. Update version number
4. Document backward compatibility notes
