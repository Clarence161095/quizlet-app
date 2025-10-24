# Routes

## Overview

This folder contains all Express.js route handlers for the Qi Learning App.

## Architecture

- **Pattern**: Express Router modules
- **Middleware Chain**: `ensureAuthenticated` → `checkMFA` → route handler
- **Views**: EJS templates rendered via `res.render()`
- **Flash Messages**: Passed via custom middleware to views

## Route Files

### auth.js
Authentication and user management routes.

**Endpoints:**
- `GET /auth/login` - Login page
- `POST /auth/login` - Login submission (Passport local strategy)
- `GET /auth/mfa-setup` - MFA setup page (admin only)
- `POST /auth/mfa-setup` - MFA setup submission
- `GET /auth/mfa-verify` - MFA verification page
- `POST /auth/mfa-verify` - MFA code verification
- `GET /auth/change-password` - Change password page
- `POST /auth/change-password` - Password change submission
- `GET /auth/logout` - Logout (destroys session)

### admin.js
Admin panel for user management.

**Endpoints:**
- `GET /admin` - Admin dashboard (admin only)
- `GET /admin/users/create` - Create user form
- `POST /admin/users/create` - Create new user
- `POST /admin/users/:id/toggle-active` - Enable/disable user
- `POST /admin/users/:id/delete` - Delete user
- `POST /admin/users/:id/reset-password` - Reset user password

**Access:** Requires admin privileges (`req.user.is_admin === 1`)

### dashboard.js
Main dashboard after login.

**Endpoints:**
- `GET /dashboard` - User dashboard with folder/set overview

### folders.js
Folder management routes.

**Endpoints:**
- `GET /folders` - List all user folders
- `GET /folders/create` - Create folder form
- `POST /folders/create` - Create folder submission
- `GET /folders/:id` - View folder details
- `GET /folders/:id/edit` - Edit folder form
- `POST /folders/:id/edit` - Update folder
- `POST /folders/:id/delete` - Delete folder
- `GET /folders/:id/manage-sets` - Manage sets in folder (many-to-many)
- `POST /folders/:id/add-set` - Add set to folder
- `POST /folders/:id/remove-set/:setId` - Remove set from folder

### sets.js
Set management and import/export routes.

**Endpoints:**
- `GET /sets` - List all user sets
- `GET /sets/create` - Create set form
- `POST /sets/create` - Create set submission
- `GET /sets/:id` - View set details
- `GET /sets/:id/edit` - Edit set form
- `POST /sets/:id/edit` - Update set
- `POST /sets/:id/delete` - Delete set
- `GET /sets/:id/import` - Import flashcards form
- `POST /sets/:id/import` - Bulk import flashcards
- `GET /sets/:id/export` - Export flashcards (text download)

**Import Format:**
- Custom separators for term/definition, notes, flashcards
- Default: TAB between term/def, `||` for notes, newline between cards
- Preview before import

### flashcards.js
Individual flashcard CRUD routes.

**Endpoints:**
- `GET /flashcards/create/:setId` - Create flashcard form
- `POST /flashcards/create/:setId` - Create flashcard
- `GET /flashcards/:id/edit` - Edit flashcard form
- `POST /flashcards/:id/edit` - Update flashcard
- `POST /flashcards/:id/toggle-star` - Toggle starred status
- `POST /flashcards/:id/delete` - Delete flashcard

### study.js
Study session routes (spaced repetition & random study).

**Endpoints:**
- `GET /study/set/:id` - Long-term study (spaced repetition)
- `GET /study/set/:id/random` - Random study (all cards)
- `GET /study/folder/:id` - Long-term study (folder)
- `GET /study/folder/:id/random` - Random study (folder)
- `POST /study/answer` - Submit answer (updates learning progress)

**Study Modes:**
- **Long-term**: Spaced repetition based on SM-2 algorithm
- **Random**: Shuffle all cards or starred cards only

### shares.js
Sharing sets and folders between users.

**Endpoints:**
- `GET /shares/my-shares` - View incoming/outgoing shares
- `GET /shares/set/:id` - Share set form
- `POST /shares/set/:id` - Create set share
- `GET /shares/folder/:id` - Share folder form
- `POST /shares/folder/:id` - Create folder share
- `POST /shares/accept/:type/:id` - Accept share (creates clone)
- `POST /shares/delete/:type/:id` - Delete share
- `POST /shares/update-from-source/:type/:id` - Pull latest changes

**Sharing Model:**
- Clone-based (recipient gets a copy)
- Source tracking (`source_set_id`, `source_folder_id`)
- Export permissions controlled by owner

## Middleware Usage

### ensureAuthenticated
Checks if user is logged in. Redirects to `/auth/login` if not.

```javascript
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/dashboard', ensureAuthenticated, (req, res) => {
  // User is authenticated here
});
```

### checkMFA
Checks if admin user has completed MFA verification. Redirects to `/auth/mfa-verify` if not.

```javascript
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');

router.get('/admin', ensureAuthenticated, checkMFA, (req, res) => {
  // User is authenticated and MFA verified (if admin)
});
```

### Middleware Chain Order

**Always use this order:**
```javascript
router.get('/path', ensureAuthenticated, checkMFA, (req, res) => {
  // Your route handler
});
```

## Flash Messages

Flash messages are temporary messages shown after redirects.

### Setting Flash Messages

```javascript
req.flash('success', 'Set created successfully!');
req.flash('error', 'Invalid credentials');
req.flash('info', 'Please complete MFA setup');
```

### Access in Views

```ejs
<% if (flash.success) { %>
  <div class="alert alert-success"><%= flash.success %></div>
<% } %>
```

Flash messages are automatically available in all views via `res.locals.flash`.

## Request Data Access

### Query Parameters

```javascript
// URL: /sets?folder=5
const folderId = req.query.folder;
```

### URL Parameters

```javascript
// Route: /sets/:id
const setId = req.params.id;
```

### POST Body

```javascript
// From form submission
const { name, description } = req.body;
```

### Authenticated User

```javascript
// Available after ensureAuthenticated middleware
const userId = req.user.id;
const isAdmin = req.user.is_admin;
```

## Response Patterns

### Render View

```javascript
res.render('sets/view', {
  set: set,
  flashcards: flashcards,
  user: req.user
});
```

### Redirect with Flash

```javascript
req.flash('success', 'Operation completed!');
res.redirect('/dashboard');
```

### JSON Response (API)

```javascript
res.json({ success: true, data: result });
```

### Download File

```javascript
res.setHeader('Content-Type', 'text/plain');
res.setHeader('Content-Disposition', 'attachment; filename="flashcards.txt"');
res.send(exportContent);
```

## Error Handling

### Try-Catch Pattern

```javascript
router.post('/sets/create', ensureAuthenticated, checkMFA, (req, res) => {
  try {
    const setId = Set.create({
      user_id: req.user.id,
      name: req.body.name,
      description: req.body.description
    });
    req.flash('success', 'Set created successfully!');
    res.redirect(`/sets/${setId}`);
  } catch (error) {
    console.error('Error creating set:', error);
    req.flash('error', 'Failed to create set');
    res.redirect('/sets/create');
  }
});
```

### Authorization Checks

```javascript
const set = Set.findById(req.params.id);
if (!set) {
  req.flash('error', 'Set not found');
  return res.redirect('/sets');
}
if (set.user_id !== req.user.id) {
  req.flash('error', 'Access denied');
  return res.redirect('/sets');
}
```

## Adding New Routes

When adding a new route file:

1. Create `src/routes/your-route.js`
2. Set up Express router
3. Add route handlers with proper middleware
4. Register in `src/server.js`:

```javascript
const yourRoutes = require('./routes/your-route');
app.use('/your-path', yourRoutes);
```

Example template:

```javascript
const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkMFA } = require('../middleware/auth');
const YourModel = require('../models/YourModel');

// List
router.get('/', ensureAuthenticated, checkMFA, (req, res) => {
  const items = YourModel.findByUser(req.user.id);
  res.render('your-route/index', { items });
});

// Create form
router.get('/create', ensureAuthenticated, checkMFA, (req, res) => {
  res.render('your-route/create');
});

// Create submission
router.post('/create', ensureAuthenticated, checkMFA, (req, res) => {
  try {
    const id = YourModel.create({
      user_id: req.user.id,
      ...req.body
    });
    req.flash('success', 'Created successfully!');
    res.redirect(`/your-path/${id}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Creation failed');
    res.redirect('/your-path/create');
  }
});

module.exports = router;
```

## Best Practices

1. **Always validate input** - Check for required fields and valid data
2. **Check ownership** - Ensure user owns the resource before modifying
3. **Use flash messages** - Provide user feedback after operations
4. **Redirect after POST** - Prevent duplicate submissions (PRG pattern)
5. **Handle errors gracefully** - Show user-friendly error messages
6. **Keep routes thin** - Complex logic should be in models or helpers
