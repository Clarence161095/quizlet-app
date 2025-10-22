# Sharing Feature Implementation

## Overview
Complete sharing system that allows users to share sets and folders with other users in the system. Recipients can clone shared content to their own account.

## Architecture

### Database Tables
- **set_shares**: Tracks set sharing relationships
  - `id`: Primary key
  - `set_id`: Foreign key to sets
  - `owner_id`: User who shared the set
  - `shared_with_user_id`: User who receives the share
  - `token`: Unique access token (32 bytes, hex)
  - `is_accepted`: Boolean flag (0 = pending, 1 = accepted/cloned)
  - `accepted_at`: Timestamp when cloned
  - `created_at`: Share creation timestamp

- **folder_shares**: Tracks folder sharing relationships
  - Same structure as set_shares, with `folder_id` instead

### Routes (`/src/routes/shares.js`)

#### Set Sharing
- **GET `/shares/sets/:id/share`** - Display share form for a set
  - Shows existing shares with status
  - Lists all system users for autocomplete
  - Requires: User owns the set

- **POST `/shares/sets/:id/share`** - Create a share
  - Validates username exists
  - Prevents self-sharing
  - Prevents duplicate shares
  - Generates unique token
  - Redirects to share form with success message

- **GET `/shares/sets/:token/view`** - Accept shared set
  - Validates token
  - Auto-clones set on first access
  - Clones all flashcards with the set
  - Marks share as accepted
  - Redirects to cloned set

#### Folder Sharing
- **GET `/shares/folders/:id/share`** - Display share form for a folder
  - Shows existing shares with status
  - Lists all system users for autocomplete
  - Requires: User owns the folder

- **POST `/shares/folders/:id/share`** - Create a share
  - Same validation as set sharing
  - Generates unique token

- **GET `/shares/folders/:token/view`** - Accept shared folder
  - Validates token
  - Auto-clones folder on first access
  - Clones all sets in the folder
  - Clones all flashcards for each set
  - Marks share as accepted
  - Redirects to cloned folder

#### Dashboard
- **GET `/shares/my-shares`** - View all shares
  - Shows received shares (pending and accepted)
  - Shows sent shares with recipient info
  - Both sets and folders in unified view

## Views

### `/src/views/shares/share-set.ejs`
- Form to share set with username input
- Datalist autocomplete for usernames
- List of existing shares with status badges
- Green badge = Accepted, Yellow badge = Pending

### `/src/views/shares/share-folder.ejs`
- Same structure as share-set.ejs
- Adapted text for folder context
- Shows all users except self

### `/src/views/shares/my-shares.ejs`
- Two-section dashboard layout
- **Received Shares**: Cards showing shared content
  - Display: name, owner, share date, status
  - Action: "Accept & Clone" button for pending shares
  - Info: Clone date for accepted shares
- **Sent Shares**: Cards showing what you shared
  - Display: name, recipient, share date, status
  - Actions: "View" and "Manage" buttons

## Integration Points

### Navigation (`/src/views/layout.ejs`)
- Added "My Shares" link to desktop nav
- Added "My Shares" link to mobile menu
- Icon: `fa-handshake`
- Position: Between "Sets" and "Admin"

### Set View Page (`/src/views/sets/view.ejs`)
- Added green "Share" button next to Edit/Delete
- Links to `/shares/sets/:id/share`
- Icon: `fa-share-alt`

### Folder View Page (`/src/views/folders/view.ejs`)
- Added green "Share" button next to Edit/Delete
- Links to `/shares/folders/:id/share`
- Icon: `fa-share-alt`

## Key Features

### Security
- Token-based access (32 random bytes)
- Validates ownership before sharing
- Prevents self-sharing
- Prevents duplicate shares
- Middleware: `ensureAuthenticated` on all routes

### Cloning Behavior
- **Sets**: Clones set + all flashcards
- **Folders**: Clones folder + all sets + all flashcards
- Cloning is automatic on first token access
- Original owner's learning progress is NOT copied
- Cloned content belongs to recipient

### Status Tracking
- `is_accepted`: 0 (pending) → 1 (accepted/cloned)
- `accepted_at`: Timestamp when clone occurred
- UI badges reflect current status

### User Experience
- Autocomplete username input (datalist)
- Visual status badges (green/yellow)
- One-click accept and clone
- Unified dashboard for all shares
- Mobile responsive design

## Usage Flow

### Sharing a Set
1. User navigates to set detail page (`/sets/:id`)
2. Clicks green "Share" button
3. Enters recipient username (autocomplete available)
4. Submits form
5. System creates share with unique token
6. Recipient sees share in "My Shares" dashboard
7. Recipient clicks "Accept & Clone"
8. System clones set and flashcards to recipient's account
9. Share marked as accepted

### Sharing a Folder
1. User navigates to folder detail page (`/folders/:id`)
2. Clicks green "Share" button
3. Enters recipient username
4. Submits form
5. System creates share with unique token
6. Recipient sees share in "My Shares" dashboard
7. Recipient clicks "Accept & Clone"
8. System clones folder, all sets, and all flashcards
9. Share marked as accepted

## Technical Notes

### Database Queries
- Uses synchronous `better-sqlite3` API (no async/await)
- Prepared statements for all queries
- Transaction support for multi-table operations
- Foreign key constraints: `ON DELETE CASCADE`

### Token Generation
```javascript
const token = crypto.randomBytes(32).toString('hex');
```

### Cloning Logic
Sets are cloned with `INSERT INTO sets SELECT...` pattern:
```javascript
const newSet = db.prepare(`
  INSERT INTO sets (name, description, user_id, folder_id, created_at)
  SELECT name, description, ?, NULL, CURRENT_TIMESTAMP
  FROM sets WHERE id = ?
`).run(req.user.id, setId);
```

Flashcards are cloned similarly, maintaining all properties except user-specific data (stars, learning progress).

### Error Handling
- 404 if set/folder not found
- 403 if user doesn't own the content
- 400 if username doesn't exist
- 400 if trying to share with self
- Flash messages for all error states

## Files Modified/Created

### Created
- `/src/routes/shares.js` (300+ lines)
- `/src/views/shares/share-set.ejs`
- `/src/views/shares/share-folder.ejs`
- `/src/views/shares/my-shares.ejs`

### Modified
- `/src/server.js` - Registered shares router
- `/src/views/layout.ejs` - Added navigation links
- `/src/views/sets/view.ejs` - Added share button
- `/src/views/folders/view.ejs` - Added share button

## Future Enhancements (Optional)
- Email notifications for new shares
- Bulk sharing (multiple recipients)
- Share expiration dates
- Permission levels (view-only vs clone)
- Share revocation
- Activity logs
- Public links (share outside system)
