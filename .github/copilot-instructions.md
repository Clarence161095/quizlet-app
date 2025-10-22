# Copilot Instructions for Quizlet Learning App

## Architecture Overview

This is a **server-rendered flashcard learning app** with spaced repetition built on Express.js + EJS + SQLite. The app uses traditional MVC patterns with synchronous SQLite queries via `better-sqlite3` (no async/await for DB operations).

### Core Components
- **Models** (`src/models/`) - Plain classes with static methods, direct SQLite access via `better-sqlite3`
- **Routes** (`src/routes/`) - Express routers handling GET/POST, render EJS views
- **Views** (`src/views/`) - EJS templates with `express-ejs-layouts` (layout.ejs wrapper)
- **Database** - Single SQLite file (`data/quizlet.db`) with session store in `data/sessions.db`

### Key Architectural Decisions
- **No ORM**: Uses raw SQL with prepared statements via `better-sqlite3` (synchronous API)
- **No Frontend Framework**: Pure server-side rendering with vanilla JS in `<script>` tags
- **Session-based Auth**: Passport.js with local strategy, MFA via Speakeasy for admins
- **EJS Script Extraction Disabled**: `extractScripts: false` in server.js - inline scripts must stay inline or use `DOMContentLoaded`

## Critical Workflows

### Development Commands
```bash
npm run dev              # Start with nodemon (auto-reload)
npm start               # Production mode
npm run init-db         # Initialize/reset database (creates default admin)
./boot.sh               # Production bootstrap (EC2 deployment)
```

### Database Access Pattern
All models use synchronous `better-sqlite3` API:
```javascript
const stmt = db.prepare('SELECT * FROM table WHERE id = ?');
const result = stmt.get(userId);  // NOT await - synchronous!
```

### Authentication Flow
1. Login → Passport local auth → Session created
2. If admin + MFA enabled → Redirect to `/auth/mfa-verify`
3. After MFA → Set `req.session.mfaVerified = true`
4. All protected routes use `ensureAuthenticated` + `checkMFA` middleware

### Study Session Architecture
- **Long-term learning**: Spaced repetition via `LearningProgress.getDueFlashcards()` (SM-2 algorithm)
- **Random study**: Shuffled flashcards from set/folder, no spaced repetition tracking
- Flashcards rendered client-side via JSON embedded in `<script>` tags
- Study answers POST to `/study/answer` which updates `learning_progress` table

## Project-Specific Conventions

### Model Patterns
All models follow this structure (see `src/models/Set.js`):
```javascript
class Set {
  static findById(id) { /* prepared statement */ }
  static findByUser(userId) { /* prepared statement */ }
  static create(data) { /* INSERT, return lastInsertRowid */ }
  static update(id, data) { /* UPDATE */ }
  static delete(id) { /* DELETE */ }
}
```

### Route Structure
Routes use middleware chain: `ensureAuthenticated, checkMFA, (req, res) => { ... }`
- Flash messages via custom middleware: `req.flash('success', 'message')`
- Access via `res.locals.flash` in views
- User always available in views as `user` and `isAuthenticated` (see server.js middleware)

### EJS View Patterns
- **Layout wrapper**: All views wrapped by `views/layout.ejs` via `express-ejs-layouts`
- **No script extraction**: Use inline `<script>` or wrap in `DOMContentLoaded`
- **Data passing**: Embed data via `const data = <%- JSON.stringify(serverData) %>;`
- **Styling**: Tailwind CSS via CDN (no build step), FontAwesome for icons

### Import/Export Feature
- **3 custom separators**: Term/Definition separator, Note separator, Flashcard separator
- Default: TAB between term/def, `||` for notes, newline between cards
- Special handling: `\t` or `tab` → actual tab character, `\n\n` → double newline
- Preview function: Client-side parsing before import (see `src/views/sets/import.ejs`)

### Spaced Repetition System
Implemented in `src/models/LearningProgress.js`:
- **Intervals**: 1, 3, 7, 15, 30, 60, 90+ days (SM-2 based)
- **Mastery**: 7 consecutive correct answers
- **Ease factor**: 2.5 default, adjusted ±0.1-0.2 per answer
- **Reset**: Incorrect answer resets consecutive_correct to 0
- Due cards queried via `next_review_date <= NOW()`, ordered by mastery status

### Study Session UI Patterns
- **Flashcard flip animation**: 3D CSS transform with `perspective`, `backface-visibility: hidden`
- **Statistics cards**: Clickable filters (Total/Mastered/Learning/New/Stars) update displayed cards
- **Filter state**: Managed via `filteredFlashcards` array, separate from original `flashcards`
  - Saved to localStorage with key `study_filter_{entityType}_{entityId}`
  - Auto-restored on page load/refresh
  - Auto-switches to available filter if selected filter has no cards
- **Real-time stats**: Update after each answer or star toggle
- **Fullscreen mode**: Press F or click button to enter focus mode
  - Hides all UI except flashcard and answer buttons
  - Maximizes flashcard display area (calc(100vh - 120px))
  - Shows temporary hint on entry, auto-hides after 3s
  - Exit button fixed top-right, or press F/ESC to exit

## Integration Points

### Database Schema Relationships
```
users (1) → (many) folders → (many) sets → (many) flashcards
users (1) + flashcards (1) → user_notes (unique constraint)
users (1) + flashcards (1) → learning_progress (unique constraint)
```

### Key Foreign Key Cascades
- `ON DELETE CASCADE`: Users delete cascades to all owned content
- `ON DELETE SET NULL`: Folder deletion sets `sets.folder_id` to NULL
- `ON DELETE CASCADE`: Set deletion removes all flashcards + progress

### External Dependencies
- **Session store**: SQLite via `connect-sqlite3` (file-based sessions)
- **MFA**: Speakeasy for TOTP generation, QRCode for setup QR
- **Markdown**: `marked` library for rendering user notes (not currently used in UI)

## Common Gotchas

1. **EJS Script Scope**: With `extractScripts: false`, functions in `<script>` tags must attach to window or use event listeners
2. **SQLite Synchronous**: No `await` on database calls - use `.get()`, `.all()`, `.run()` directly
3. **MFA Middleware Order**: Always `ensureAuthenticated` before `checkMFA` in route chains
4. **Flashcard Disappearing Bug**: Common with CSS animations - use fixed height, proper `transform-style: preserve-3d`
5. **Filter State Sync**: When toggling stars during filtered view, must refresh filter or risk showing wrong cards
6. **Null Element Access**: Always check if DOM element exists before setting innerHTML/textContent (filters may not exist in all views)
7. **Filter Auto-Switch**: When a filter has no cards, system auto-switches to first available filter with data to prevent empty states

## Key File References

- **Spaced Repetition Logic**: `src/models/LearningProgress.js` (lines 54-98)
- **Import Parser**: `src/routes/sets.js` (lines 115-185)
- **Study Session UI**: `src/views/study/session.ejs` (flip animation CSS at bottom)
- **Auth Middleware**: `src/middleware/auth.js` (ensureAuthenticated, checkMFA patterns)
- **DB Schema**: `src/database/init.js` (complete table definitions)
