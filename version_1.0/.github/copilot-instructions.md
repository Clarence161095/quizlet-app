```instructions
# Copilot Instructions for Qi Learning App

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
- **Mobile First Design**: All UI built with mobile-first responsive approach using Tailwind CSS breakpoints

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
- **Mobile-First Responsive**: 
  - Always start with mobile styles (320px), then add `sm:` (640px), `lg:` (1024px) breakpoints
  - Custom `xs:` breakpoint at 475px for text toggles
  - Use `flex-wrap gap-2` for mobile button groups, `sm:flex-nowrap` for desktop
  - Always show full button text (not just icons) for better UX - users prefer clarity over compactness

### Import/Export Feature
- **3 custom separators**: Term/Definition separator, Note separator, Flashcard separator
- Default: TAB between term/def, `||` for notes, newline between cards
- Special handling: `\t` or `tab` → actual tab character, `\n\n` → double newline
- Preview function: Client-side parsing before import (see `src/views/sets/import.ejs`)

### Sharing Feature
- **Clone-based sharing**: Sets/Folders shared by creating copies (clones) for recipients
- **Source tracking**: Cloned entities have `source_set_id`/`source_folder_id` pointing to original
- **Update from source**: Recipients can pull latest changes while keeping learning progress
- **Export permission**: Owners control if recipients can export cloned content (`allow_export` flag)
- **Cloned sets restrictions**: Cannot edit/import/add cards directly - must update from source or delete
- **Share states**: pending (not accepted), accepted (clone exists), accepted but deleted (clone removed)

### Spaced Repetition System
Implemented in `src/models/LearningProgress.js`:
- **Modified SM-2 Algorithm**: Intervals are 1, 3, 7, 15, 30, 60, then `interval × ease_factor`
- **Mastery**: 4 consecutive correct answers = PERMANENT mastered status (never resets)
- **Ease factor**: 2.5 default, +0.1 on correct (max 3.0), -0.2 on incorrect (min 1.3)
- **Reset behavior**: Incorrect answer resets `consecutive_correct` and `repetitions` to 0, BUT `is_mastered` remains 1 if already mastered
- **Due cards**: Query `next_review_date <= NOW()`, order by `is_mastered ASC` (learning first, mastered last)
- **Critical**: Once a card reaches 4 consecutive correct, it stays mastered forever (Vietnamese comment: "KHÔNG BAO GIỜ RESET")

### Study Session UI Patterns
- **Flashcard flip animation**: 3D CSS transform with `perspective`, `backface-visibility: hidden`
- **Statistics cards**: Clickable filters (Total/**Learned**/Learning/New/Stars) update displayed cards
  - UI shows "Learned" not "Mastered" - matches user-friendly terminology
- **Filter state**: Managed via `filteredFlashcards` array, separate from original `flashcards`
  - Saved to localStorage with key `study_filter_{entityType}_{entityId}`
  - Auto-restored on page load/refresh
  - Auto-switches to available filter if selected filter has no cards
- **Real-time stats**: Update after each answer or star toggle
- **Focus Mode (LEARN button)**: Press F or click LEARN to enter fullscreen study mode
  - Uses `.hide-in-fullscreen` class on all non-essential UI elements
  - Only shows: progress bar (compact), flashcard/multi-choice, star button, answer buttons, exit button
  - Hides: header, stats cards, mode selector, filter info, shortcuts, notes button
  - Exit via top-right button, F key, or ESC key
  - Desktop: Better spacing and larger text (responsive media queries)
- **Star buttons**: No borders, transparent background, scale on hover (1.15x), always visible in corner
  - Real-time toggle: Force remove/add classes explicitly + trigger repaint with `btn.offsetHeight`
- **Button Layout Responsive**:
  - Mobile: `flex-wrap gap-2` with `flex-1` for equal width, full text visible
  - Desktop: `sm:flex-nowrap sm:flex-initial` for natural sizing
  - Touch targets: Minimum 44px height (`py-2`) on mobile for accessibility

## Integration Points

### Database Schema Relationships
```
users (1) → (many) folders
users (1) → (many) sets
folders (many) ←→ (many) sets via folder_sets junction table
sets (1) → (many) flashcards
users (1) + flashcards (1) → user_notes (unique constraint)
users (1) + flashcards (1) → learning_progress (unique constraint)
```

### Key Database Patterns
- **Many-to-Many Folders**: Sets can belong to multiple folders via `folder_sets` junction table
  - `sets.folder_id` kept for backward compatibility but deprecated
  - Use `Folder.getSetsInFolder()` and `Folder.addSetToFolder()` for folder-set relationships
  - Order by `added_at` in junction table for chronological display

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
8. **Mobile Button Layout**: Always use `flex-wrap` for mobile, never force buttons to single column with `flex-col` - buttons should wrap naturally
9. **Star Toggle Realtime**: Must explicitly remove/add classes (not toggle) and force repaint with `element.offsetHeight` for immediate visual update
10. **Focus Mode CSS**: Use `body.focus-mode-active` prefix for all focus mode styles, apply `.hide-in-fullscreen` class to hide elements

## Key File References

- **Spaced Repetition Logic**: `src/models/LearningProgress.js` (lines 54-98)
- **Import Parser**: `src/routes/sets.js` (lines 115-185)
- **Study Session UI**: `src/views/study/session.ejs` (flip animation CSS at bottom)
- **Auth Middleware**: `src/middleware/auth.js` (ensureAuthenticated, checkMFA patterns)
- **DB Schema**: `src/database/init.js` (complete table definitions)
```
