# Models

## Overview

This folder contains all data models for the Qi Learning App. Models provide an abstraction layer over database operations.

## Architecture

- **Pattern**: Active Record-like pattern with static methods
- **Database**: Direct access via `better-sqlite3` (synchronous)
- **No ORM**: Raw SQL with prepared statements for maximum control

## Available Models

### User.js
Manages user accounts and authentication.

**Key Methods:**
- `findById(id)` - Get user by ID
- `findByUsername(username)` - Get user by username
- `create({ username, password, email, is_admin })` - Create new user
- `update(id, data)` - Update user data
- `updatePassword(id, newPassword)` - Change password
- `setMFASecret(id, secret)` - Set MFA secret
- `enableMFA(id)` - Enable MFA for user
- `toggleActive(id)` - Toggle user active status
- `delete(id)` - Delete user (cascades to all content)

### Folder.js
Manages folder organization.

**Key Methods:**
- `findById(id)` - Get folder by ID
- `findByUser(userId)` - Get all folders for user
- `create({ user_id, name, description })` - Create folder
- `update(id, data)` - Update folder
- `delete(id)` - Delete folder (sets.folder_id → NULL)
- `getSetsInFolder(folderId)` - Get all sets in folder (via junction table)
- `addSetToFolder(folderId, setId)` - Add set to folder
- `removeSetFromFolder(folderId, setId)` - Remove set from folder

**Note**: v1.0.0 uses `folder_sets` junction table for many-to-many relationships.

### Set.js
Manages flashcard sets.

**Key Methods:**
- `findById(id)` - Get set by ID
- `findByUser(userId)` - Get all sets for user
- `findByFolder(folderId)` - Get sets in folder (deprecated, use Folder.getSetsInFolder)
- `create({ user_id, name, description, folder_id })` - Create set
- `update(id, data)` - Update set
- `delete(id)` - Delete set (cascades to flashcards)
- `clone(setId, newUserId, sourceSetId)` - Clone set for sharing

### Flashcard.js
Manages individual flashcards.

**Key Methods:**
- `findById(id)` - Get flashcard by ID
- `findBySet(setId)` - Get all flashcards in set
- `create({ set_id, word, definition })` - Create flashcard
- `update(id, data)` - Update flashcard
- `delete(id)` - Delete flashcard (cascades to notes & progress)
- `toggleStar(id, userId)` - Toggle starred status
- `getStarredBySet(setId, userId)` - Get starred flashcards in set
- `bulkCreate(setId, flashcards)` - Bulk insert flashcards (transaction)

### UserNote.js
Manages user-specific notes for flashcards.

**Key Methods:**
- `findByUserAndFlashcard(userId, flashcardId)` - Get note
- `findBySet(userId, setId)` - Get all notes for set
- `createOrUpdate({ user_id, flashcard_id, note })` - Upsert note
- `delete(userId, flashcardId)` - Delete note

**Note**: Each user can have one note per flashcard (unique constraint).

### LearningProgress.js
Manages spaced repetition tracking (SM-2 algorithm).

**Key Methods:**
- `findByUserAndFlashcard(userId, flashcardId)` - Get progress
- `getDueFlashcards(userId, setId)` - Get flashcards due for review
- `getDueFlashcardsForFolder(userId, folderId)` - Get due cards in folder
- `updateProgress({ user_id, flashcard_id, is_correct })` - Record answer
- `getStatsBySet(userId, setId)` - Get mastery statistics
- `getStatsByFolder(userId, folderId)` - Get folder statistics

**Spaced Repetition Details:**
- Intervals: 1, 3, 7, 15, 30, 60, 90+ days
- Mastered: 7 consecutive correct answers
- Ease factor: 2.5 default, adjusted ±0.1-0.2 per answer
- Wrong answer: Resets consecutive_correct to 0

## Common Patterns

### Basic CRUD

```javascript
const Set = require('./models/Set');

// Create
const setId = Set.create({
  user_id: 1,
  name: 'Spanish Vocabulary',
  description: 'Basic words'
});

// Read
const set = Set.findById(setId);
const userSets = Set.findByUser(1);

// Update
Set.update(setId, { name: 'Spanish Vocabulary - Lesson 1' });

// Delete
Set.delete(setId);
```

### Error Handling

```javascript
try {
  const user = User.findByUsername('john');
  if (!user) {
    throw new Error('User not found');
  }
} catch (error) {
  console.error('Database error:', error);
}
```

### Transactions (Bulk Operations)

```javascript
const flashcards = [
  { word: 'hola', definition: 'hello' },
  { word: 'adiós', definition: 'goodbye' }
];

Flashcard.bulkCreate(setId, flashcards);
```

## Database Access

Models use the synchronous `better-sqlite3` API:

```javascript
const { db } = require('../database/init');

class Set {
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM sets WHERE id = ?');
    return stmt.get(id);  // NOT await - synchronous!
  }
}
```

## Security

### SQL Injection Protection

✅ **CORRECT** - Use prepared statements with placeholders:
```javascript
const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
const user = stmt.get(username);
```

❌ **WRONG** - Never concatenate user input:
```javascript
const user = db.prepare(`SELECT * FROM users WHERE username = '${username}'`).get();
```

### Password Hashing

Passwords are hashed with bcryptjs before storage:
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = bcrypt.hashSync(password, 10);
User.create({ username, password: hashedPassword });
```

## Relationship Navigation

### One-to-Many

```javascript
// User → Sets
const userSets = Set.findByUser(userId);

// Set → Flashcards
const flashcards = Flashcard.findBySet(setId);
```

### Many-to-Many (Folders ↔ Sets)

```javascript
// Get sets in folder
const sets = Folder.getSetsInFolder(folderId);

// Add set to folder
Folder.addSetToFolder(folderId, setId);

// Remove set from folder
Folder.removeSetFromFolder(folderId, setId);
```

### One-to-One (User + Flashcard → Note)

```javascript
// Get or create note
const note = UserNote.findByUserAndFlashcard(userId, flashcardId);
if (!note) {
  UserNote.createOrUpdate({ user_id: userId, flashcard_id: flashcardId, note: 'My note' });
}
```

## Testing Models

Use the Node.js REPL for quick testing:

```bash
node
```

```javascript
const User = require('./src/models/User');
const users = User.findAll();
console.log(users);
```

## Best Practices

1. **Always use prepared statements** - Prevent SQL injection
2. **Return early on null checks** - Guard against undefined errors
3. **Use transactions for bulk operations** - Ensure atomicity
4. **Keep models thin** - Business logic belongs in routes/controllers
5. **Document complex queries** - Explain JOIN logic and filtering

## Adding New Models

When creating a new model:

1. Create file in `src/models/YourModel.js`
2. Follow existing model patterns (static methods)
3. Add JSDoc comments for key methods
4. Update this README with model description
5. Add database table via migration (see database/MIGRATION.md)

Example template:

```javascript
const { db } = require('../database/init');

class YourModel {
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM your_table WHERE id = ?');
    return stmt.get(id);
  }

  static create(data) {
    const stmt = db.prepare('INSERT INTO your_table (...) VALUES (...)');
    const result = stmt.run(...);
    return result.lastInsertRowid;
  }

  static update(id, data) {
    const stmt = db.prepare('UPDATE your_table SET ... WHERE id = ?');
    return stmt.run(..., id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM your_table WHERE id = ?');
    return stmt.run(id);
  }
}

module.exports = YourModel;
```
