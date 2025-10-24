# Qi Learning App - Development Guide

## Table of Contents

- [Development Environment Setup](#development-environment-setup)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Code Organization](#code-organization)
- [Database Development](#database-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Common Development Tasks](#common-development-tasks)
- [Contribution Guidelines](#contribution-guidelines)

## Development Environment Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- SQLite 3
- Git
- VS Code (recommended)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd quizlet-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and set SESSION_SECRET
nano .env

# Initialize database
npm run init-db

# Start development server
npm run dev
```

### Development Server

```bash
# Start with auto-reload (nodemon)
npm run dev

# Start production mode
npm start
```

The app runs on `http://localhost:3000` by default.

### VS Code Extensions (Recommended)

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **EJS language support** - Syntax highlighting for EJS templates
- **SQLite Viewer** - View database contents

## Project Architecture

### Technology Stack

```
┌─────────────────────────────────────┐
│         Express.js Server           │
├─────────────────────────────────────┤
│  Routes → Models → Database         │
│    ↓         ↓         ↓            │
│   EJS    SQLite3   better-sqlite3   │
└─────────────────────────────────────┘
```

### MVC Pattern

- **Models** (`src/models/`) - Data access layer, direct SQLite queries
- **Views** (`src/views/`) - EJS templates for UI
- **Controllers** (`src/routes/`) - Request handlers and business logic

### Key Design Decisions

1. **No ORM** - Direct SQL with prepared statements for clarity and control
2. **Synchronous DB** - better-sqlite3 for simplicity (no async/await)
3. **Server-Side Rendering** - Traditional web app, no SPA framework
4. **SQLite** - Lightweight, serverless database (perfect for small-to-medium scale)
5. **Session-Based Auth** - Passport.js with local strategy

## Development Workflow

### Feature Development Process

1. **Plan the feature** - Document in design/ folder if complex
2. **Database changes** - Update schema in `src/database/init.js`
3. **Create/update models** - Add data access methods
4. **Create routes** - Add Express route handlers
5. **Create views** - Add EJS templates
6. **Test manually** - Use the app to verify functionality
7. **Document** - Update relevant README files

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit frequently
git add .
git commit -m "feat: add user profile editing"

# Push to remote
git push origin feature/your-feature-name

# Create pull request for review
```

### Commit Message Convention

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code refactoring
- `style:` - Code style changes (formatting)
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add folder many-to-many relationship
fix: flashcard flip animation on mobile
docs: update database migration guide
refactor: extract spaced repetition logic to helper
```

## Code Organization

### Directory Structure

```
src/
├── server.js           # Main Express app
├── config/             # Configuration (passport, etc.)
├── database/           # Database init and migrations
├── middleware/         # Express middleware
├── models/             # Data models (Active Record pattern)
├── routes/             # Route handlers (controllers)
├── views/              # EJS templates
│   ├── layout.ejs      # Main layout wrapper
│   ├── auth/           # Authentication views
│   ├── dashboard/      # Dashboard views
│   └── ...
└── helpers/            # Utility functions
```

### File Naming Conventions

- **Models**: PascalCase (e.g., `User.js`, `LearningProgress.js`)
- **Routes**: kebab-case (e.g., `auth.js`, `study.js`)
- **Views**: kebab-case folders, files (e.g., `sets/create.ejs`)
- **Middleware**: camelCase (e.g., `auth.js`)

## Database Development

### Adding a New Table

1. **Update init.js**:
```javascript
// src/database/init.js
db.exec(`
  CREATE TABLE IF NOT EXISTS your_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
```

2. **Document in MIGRATION.md**:
```markdown
#### 12. Your Table
Description of the table...
```

3. **Reset database** (development only):
```bash
rm data/quizlet.db
npm run init-db
```

### Adding Columns to Existing Tables

For development databases, just update `init.js` and reset.

For production databases, create a migration script:

```javascript
// src/database/migrations/add-your-column.js
const { db } = require('../init');

db.exec('ALTER TABLE your_table ADD COLUMN new_column TEXT');
console.log('Migration completed');
```

Run once on production database.

### Querying Database

All queries use synchronous `better-sqlite3` API:

```javascript
const { db } = require('./database/init');

// Single row
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

// Multiple rows
const sets = db.prepare('SELECT * FROM sets WHERE user_id = ?').all(userId);

// Insert/Update/Delete
const result = db.prepare('INSERT INTO sets (name, user_id) VALUES (?, ?)').run(name, userId);
const newId = result.lastInsertRowid;
```

## Frontend Development

### EJS Templates

Views use EJS with `express-ejs-layouts` for shared layout.

**Layout structure:**
```ejs
<!-- views/layout.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= typeof title !== 'undefined' ? title : 'Qi Learning App' %></title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>
  <%- body %>
</body>
</html>
```

**Page template:**
```ejs
<!-- views/sets/create.ejs -->
<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold">Create Set</h1>
  
  <form method="POST" action="/sets/create">
    <input type="text" name="name" class="border p-2" required>
    <button type="submit" class="bg-blue-500 text-white px-4 py-2">Create</button>
  </form>
</div>
```

### Styling with Tailwind CSS

Use Tailwind CSS classes (loaded via CDN):

```html
<!-- Mobile-first responsive -->
<div class="flex flex-wrap gap-2 sm:flex-nowrap">
  <button class="flex-1 sm:flex-initial bg-blue-500 text-white px-4 py-2">
    Button Text
  </button>
</div>
```

**Breakpoints:**
- Default: Mobile (320px+)
- `sm:` - Small tablets (640px+)
- `lg:` - Desktop (1024px+)

### Client-Side JavaScript

Inline scripts in EJS templates (no extraction):

```ejs
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Your code here
    const button = document.getElementById('myButton');
    button.addEventListener('click', function() {
      alert('Clicked!');
    });
  });
</script>
```

**Passing server data to client:**
```ejs
<script>
  const flashcards = <%- JSON.stringify(flashcards) %>;
  console.log(flashcards);
</script>
```

## Testing

### Manual Testing Checklist

For each feature:

- [ ] Create functionality works
- [ ] Read/List functionality works
- [ ] Update functionality works
- [ ] Delete functionality works
- [ ] Authorization checks work (can't access other users' data)
- [ ] Flash messages display correctly
- [ ] Mobile layout is responsive
- [ ] Desktop layout is responsive

### Database Testing

Use Node.js REPL:

```bash
node
```

```javascript
const User = require('./src/models/User');
const Set = require('./src/models/Set');

// Test queries
const users = User.findAll();
console.log(users);

const set = Set.create({ user_id: 1, name: 'Test Set' });
console.log('Created set:', set);
```

### Testing Spaced Repetition

Manually adjust `next_review_date` to test due cards:

```javascript
const { db } = require('./src/database/init');

// Make cards due now
db.prepare('UPDATE learning_progress SET next_review_date = datetime("now")').run();
```

## Debugging

### Console Logging

Add strategic console.log statements:

```javascript
router.post('/sets/create', (req, res) => {
  console.log('Body:', req.body);
  console.log('User:', req.user);
  
  try {
    const setId = Set.create(req.body);
    console.log('Created set ID:', setId);
    res.redirect(`/sets/${setId}`);
  } catch (error) {
    console.error('Error:', error);
    res.redirect('/sets/create');
  }
});
```

### Viewing Database

Install SQLite browser extension in VS Code or use command line:

```bash
sqlite3 data/quizlet.db

.tables
SELECT * FROM users;
.quit
```

### Debugging Sessions

Session issues? Check session database:

```bash
sqlite3 data/sessions.db
SELECT * FROM sessions;
```

## Performance Optimization

### Database Indexing

For large datasets, add indexes:

```sql
CREATE INDEX idx_flashcards_set_id ON flashcards(set_id);
CREATE INDEX idx_learning_progress_due ON learning_progress(next_review_date);
```

### Query Optimization

Use transactions for bulk operations:

```javascript
const insertMany = db.transaction((flashcards) => {
  const stmt = db.prepare('INSERT INTO flashcards (set_id, word, definition) VALUES (?, ?, ?)');
  for (const card of flashcards) {
    stmt.run(card.set_id, card.word, card.definition);
  }
});

insertMany(flashcardArray);
```

## Common Development Tasks

### Adding a New Route

```javascript
// src/routes/your-feature.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');

router.get('/', ensureAuthenticated, checkMFA, (req, res) => {
  res.render('your-feature/index');
});

module.exports = router;
```

Register in `src/server.js`:
```javascript
const yourFeature = require('./routes/your-feature');
app.use('/your-feature', yourFeature);
```

### Adding a New Model

```javascript
// src/models/YourModel.js
const { db } = require('../database/init');

class YourModel {
  static findById(id) {
    return db.prepare('SELECT * FROM your_table WHERE id = ?').get(id);
  }

  static create(data) {
    const result = db.prepare('INSERT INTO your_table (...) VALUES (...)').run(...);
    return result.lastInsertRowid;
  }
}

module.exports = YourModel;
```

### Adding a New View

```ejs
<!-- src/views/your-feature/index.ejs -->
<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Your Feature</h1>
  
  <!-- Your content -->
</div>
```

## Contribution Guidelines

### Before Submitting PR

1. Test all functionality manually
2. Check console for errors
3. Verify responsive design (mobile + desktop)
4. Update documentation if needed
5. Follow code style (consistent with existing code)

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JS, double for HTML/EJS
- **Semicolons**: Yes, always
- **Naming**: camelCase for variables/functions, PascalCase for classes

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if UI changes)
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Locked

```bash
# Ensure only one server instance
pkill -f "node src/server.js"
npm run dev
```

### Session Issues

```bash
# Clear sessions
rm data/sessions.db
# Restart server
```

## Resources

- **Express.js Docs**: https://expressjs.com/
- **EJS Docs**: https://ejs.co/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **better-sqlite3**: https://github.com/WiseLibs/better-sqlite3
- **Passport.js**: http://www.passportjs.org/

## Getting Help

- Check existing documentation in `docs/` and folder README files
- Search codebase for similar implementations
- Review commit history for context on changes
- Ask in team chat/discussions

---

**Happy coding! 🚀**
