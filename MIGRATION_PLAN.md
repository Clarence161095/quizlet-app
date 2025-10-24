# QI LEARNING APP - MIGRATION PLAN v1.0 → v2.0

## 📊 OVERVIEW

### Current Architecture (v1.0)
- **Frontend**: Server-side rendering (EJS + Express)
- **Backend**: Express.js + better-sqlite3 (synchronous)
- **Auth**: Passport.js + Session-based
- **Deployment**: Traditional Node.js server

### Target Architecture (v2.0)
- **Frontend**: React 18 + Vite + React Router (SPA)
- **Backend**: Express.js + RESTful API + JWT
- **Database**: PostgreSQL (pg driver)
- **Deployment**: Docker Compose (Frontend + Backend + PostgreSQL + Nginx)

---

## 🎯 MIGRATION STRATEGY

### Phase 1: Project Structure Setup
1. Copy current code to `version_1.0/` (reference only)
2. Create `version_2.0/` with structure:
   ```
   version_2.0/
   ├── frontend/          # React + Vite app
   ├── backend/           # Express API server
   ├── database/          # PostgreSQL schemas + migration scripts
   ├── nginx/             # Nginx configuration
   └── docker-compose.yml # Orchestration
   ```

### Phase 2: Backend API Development
1. **Database Layer**: SQLite → PostgreSQL migration
   - Convert schema to PostgreSQL
   - Create migration script (SQLite data → PostgreSQL)
   - Update models to use `pg` instead of `better-sqlite3`

2. **API Layer**: Convert routes to RESTful endpoints
   - Auth: Session → JWT authentication
   - Convert all routes to API endpoints
   - Keep 100% business logic unchanged

3. **API Endpoints Map**:
   ```
   Auth:
   POST   /api/auth/login
   POST   /api/auth/logout
   POST   /api/auth/change-password
   POST   /api/auth/mfa-setup
   POST   /api/auth/mfa-verify
   GET    /api/auth/me

   Sets:
   GET    /api/sets
   POST   /api/sets
   GET    /api/sets/:id
   PUT    /api/sets/:id
   DELETE /api/sets/:id
   POST   /api/sets/:id/import
   GET    /api/sets/:id/export

   Folders:
   GET    /api/folders
   POST   /api/folders
   GET    /api/folders/:id
   PUT    /api/folders/:id
   DELETE /api/folders/:id
   POST   /api/folders/:id/sets/add
   DELETE /api/folders/:id/sets/:setId

   Flashcards:
   GET    /api/flashcards (by set_id)
   POST   /api/flashcards
   GET    /api/flashcards/:id
   PUT    /api/flashcards/:id
   DELETE /api/flashcards/:id
   POST   /api/flashcards/:id/toggle-star
   POST   /api/flashcards/:id/notes

   Study:
   GET    /api/study/due (get due flashcards)
   POST   /api/study/answer
   GET    /api/study/stats

   Shares:
   POST   /api/shares/sets/:id
   POST   /api/shares/folders/:id
   GET    /api/shares/received
   POST   /api/shares/:token/accept
   POST   /api/shares/:id/update-from-source

   Admin:
   GET    /api/admin/users
   POST   /api/admin/users
   PUT    /api/admin/users/:id
   DELETE /api/admin/users/:id
   ```

### Phase 3: Frontend Development
1. **Setup React + Vite**:
   - Tailwind CSS (same config as v1.0)
   - React Router for navigation
   - Axios for API calls
   - Context API for state management

2. **Component Structure** (mimic current views):
   ```
   src/
   ├── components/
   │   ├── Layout/
   │   │   ├── Header.jsx
   │   │   ├── Sidebar.jsx
   │   │   └── Footer.jsx
   │   ├── Auth/
   │   │   ├── Login.jsx
   │   │   ├── ChangePassword.jsx
   │   │   ├── MfaSetup.jsx
   │   │   └── MfaVerify.jsx
   │   ├── Dashboard/
   │   │   └── Dashboard.jsx
   │   ├── Sets/
   │   │   ├── SetsList.jsx
   │   │   ├── SetView.jsx
   │   │   ├── SetCreate.jsx
   │   │   ├── SetEdit.jsx
   │   │   ├── SetImport.jsx
   │   │   └── SetExport.jsx
   │   ├── Folders/
   │   │   ├── FoldersList.jsx
   │   │   ├── FolderView.jsx
   │   │   ├── FolderCreate.jsx
   │   │   └── FolderEdit.jsx
   │   ├── Flashcards/
   │   │   ├── FlashcardCreate.jsx
   │   │   └── FlashcardEdit.jsx
   │   ├── Study/
   │   │   └── StudySession.jsx (most complex!)
   │   ├── Shares/
   │   │   ├── MyShares.jsx
   │   │   ├── ShareSet.jsx
   │   │   └── ShareFolder.jsx
   │   └── Admin/
   │       ├── AdminDashboard.jsx
   │       └── CreateUser.jsx
   ├── contexts/
   │   ├── AuthContext.jsx
   │   └── AppContext.jsx
   ├── hooks/
   │   ├── useAuth.js
   │   ├── useApi.js
   │   └── useLocalStorage.js
   ├── services/
   │   └── api.js
   └── utils/
       ├── constants.js
       └── helpers.js
   ```

3. **Key Features to Preserve**:
   - ✅ Spaced Repetition Algorithm (SM-2) - 100% same logic
   - ✅ Multi-choice quiz mode
   - ✅ Flashcard flip animation (CSS)
   - ✅ Star/filter system with localStorage
   - ✅ Focus Mode (LEARN button)
   - ✅ Import/Export with custom separators
   - ✅ Sharing with clone-based system
   - ✅ MFA for admin
   - ✅ Mobile-first responsive design

### Phase 4: Docker Setup
1. **Dockerfile for Frontend** (Vite production build)
2. **Dockerfile for Backend** (Node.js)
3. **docker-compose.yml**:
   - PostgreSQL service
   - Backend API service
   - Frontend service (built static files)
   - Nginx reverse proxy

### Phase 5: Data Migration
1. Create script: `database/migrate-sqlite-to-postgres.js`
2. Export all data from SQLite
3. Import to PostgreSQL with proper type conversion
4. Verify data integrity

### Phase 6: Testing & Deployment
1. Test all features locally
2. Test on LAN (Vite host config)
3. Deploy with `docker-compose up`

---

## 🔧 CRITICAL IMPLEMENTATION NOTES

### 1. Study Session Component (Most Complex)
- Must replicate exact behavior of `src/views/study/session.ejs`
- Filter states stored in localStorage
- Real-time stats updates
- Flashcard flip animation (3D CSS)
- Multi-choice rendering with checkbox/radio
- Focus mode with keyboard shortcuts (L, ESC, Space, Arrow keys)
- Star toggle with immediate UI update

### 2. Spaced Repetition Logic
- **PRESERVE EXACTLY**: `src/models/LearningProgress.js` logic
- Modified SM-2 algorithm: 1, 3, 7, 15, 30, 60 days
- Mastery = 4 consecutive correct (NEVER resets)
- Ease factor: 2.5 default, +0.1 correct (max 3.0), -0.2 incorrect (min 1.3)

### 3. Authentication Flow
- Session → JWT tokens
- Store JWT in httpOnly cookie (secure)
- Refresh token mechanism
- MFA still required for admin users

### 4. Import/Export Feature
- Custom separators: term/def, notes, flashcard
- Special handling: `\t`, `tab`, `\n\n`
- Preview before import

### 5. Sharing System
- Clone-based: creates copies not references
- Source tracking: `source_set_id`, `source_folder_id`
- Update from source preserves learning progress
- Export permission flag

---

## 📝 EXECUTION CHECKLIST

- [ ] Phase 1: Copy to version_1.0, create version_2.0 structure
- [ ] Phase 2A: PostgreSQL schema creation
- [ ] Phase 2B: Backend models (pg driver)
- [ ] Phase 2C: RESTful API routes
- [ ] Phase 2D: JWT authentication
- [ ] Phase 3A: React project setup (Vite + Tailwind)
- [ ] Phase 3B: Core components (Layout, Auth, Dashboard)
- [ ] Phase 3C: Sets/Folders/Flashcards components
- [ ] Phase 3D: Study Session component (critical!)
- [ ] Phase 3E: Shares components
- [ ] Phase 3F: Admin components
- [ ] Phase 4A: Dockerfiles
- [ ] Phase 4B: docker-compose.yml
- [ ] Phase 4C: Nginx configuration
- [ ] Phase 5: Data migration script
- [ ] Phase 6: Testing & deployment

---

## 🚀 READY TO START

Next step: Execute Phase 1 - Project Structure Setup
