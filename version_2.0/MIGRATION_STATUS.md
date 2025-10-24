# QI APP V2.0 - MIGRATION PROGRESS

## ✅ COMPLETED

### Phase 1: Project Structure ✓
- [x] Created version_1.0 (reference copy)
- [x] Created version_2.0 structure
  - [x] frontend/
  - [x] backend/
  - [x] database/
  - [x] nginx/

### Infrastructure Files ✓
- [x] docker-compose.yml (PostgreSQL + Backend + Frontend + Nginx)
- [x] database/init.sql (PostgreSQL schema)
- [x] database/migrate-sqlite-to-postgres.js (Migration script)
- [x] nginx/nginx.conf
- [x] nginx/default.conf

### Backend Setup ✓
- [x] backend/package.json
- [x] backend/Dockerfile
- [x] backend/.env.example
- [x] backend/src/config/database.js (PostgreSQL connection)
- [x] backend/src/middleware/auth.js (JWT authentication)

## 🚧 IN PROGRESS

### Backend API Development (NEXT STEPS)

#### 1. Models Layer (Convert from SQLite to PostgreSQL)
Cần tạo các file models với PostgreSQL async/await pattern:

- [ ] `backend/src/models/User.js` - User authentication & management
- [ ] `backend/src/models/Set.js` - Flashcard sets
- [ ] `backend/src/models/Folder.js` - Folders with many-to-many sets
- [ ] `backend/src/models/Flashcard.js` - Flashcards with images
- [ ] `backend/src/models/LearningProgress.js` - **CRITICAL** Spaced repetition logic
- [ ] `backend/src/models/UserNote.js` - Personal notes
- [ ] `backend/src/models/Share.js` - Sharing logic

**Key Changes:**
- SQLite `db.prepare().get()` → PostgreSQL `await queryOne()`
- SQLite `db.prepare().all()` → PostgreSQL `await queryAll()`
- SQLite `db.prepare().run()` → PostgreSQL `await query()`
- Keep 100% business logic unchanged!

#### 2. API Routes (Convert from EJS routes to RESTful API)

**Auth Routes** (`backend/src/routes/auth.js`)
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/change-password
GET    /api/auth/me
POST   /api/auth/mfa-setup
POST   /api/auth/mfa-verify
POST   /api/auth/mfa-disable
```

**Sets Routes** (`backend/src/routes/sets.js`)
```
GET    /api/sets              - List user's sets
POST   /api/sets              - Create new set
GET    /api/sets/:id          - Get set details + flashcards
PUT    /api/sets/:id          - Update set
DELETE /api/sets/:id          - Delete set
POST   /api/sets/:id/import   - Import flashcards
GET    /api/sets/:id/export   - Export flashcards
POST   /api/sets/:id/clone    - Clone from source
```

**Folders Routes** (`backend/src/routes/folders.js`)
```
GET    /api/folders                      - List user's folders
POST   /api/folders                      - Create folder
GET    /api/folders/:id                  - Get folder details
PUT    /api/folders/:id                  - Update folder
DELETE /api/folders/:id                  - Delete folder
POST   /api/folders/:id/sets             - Add set to folder
DELETE /api/folders/:id/sets/:setId     - Remove set from folder
GET    /api/folders/:id/flashcards       - Get all flashcards in folder
```

**Flashcards Routes** (`backend/src/routes/flashcards.js`)
```
GET    /api/flashcards?set_id=X    - List flashcards in set
POST   /api/flashcards             - Create flashcard
GET    /api/flashcards/:id         - Get flashcard
PUT    /api/flashcards/:id         - Update flashcard
DELETE /api/flashcards/:id         - Delete flashcard
POST   /api/flashcards/:id/star    - Toggle star
POST   /api/flashcards/:id/note    - Save user note
GET    /api/flashcards/:id/note    - Get user note
```

**Study Routes** (`backend/src/routes/study.js`)
```
GET    /api/study/due              - Get due flashcards (long-term)
POST   /api/study/answer           - Submit answer (update progress)
GET    /api/study/stats/:type/:id  - Get study statistics
GET    /api/study/random/:type/:id - Get random flashcards
```

**Shares Routes** (`backend/src/routes/shares.js`)
```
POST   /api/shares/sets/:id              - Share set with user
POST   /api/shares/folders/:id           - Share folder with user
GET    /api/shares/received              - Get received shares
POST   /api/shares/:token/accept         - Accept share (clone)
DELETE /api/shares/:id                   - Delete share
POST   /api/shares/sets/:id/update       - Update from source
POST   /api/shares/folders/:id/update    - Update from source
```

**Admin Routes** (`backend/src/routes/admin.js`)
```
GET    /api/admin/users           - List all users
POST   /api/admin/users           - Create user
PUT    /api/admin/users/:id       - Update user
DELETE /api/admin/users/:id       - Delete user
POST   /api/admin/users/:id/reset - Reset password
```

**Dashboard Route**
```
GET    /api/dashboard             - Get dashboard data (stats + recent items)
```

#### 3. Main Server File
- [ ] `backend/src/server.js` - Express app with CORS, routes, error handling

### Frontend Development (React + Vite)

#### 1. Setup
- [ ] Initialize Vite React project
- [ ] Setup Tailwind CSS (same config as v1.0)
- [ ] Setup React Router
- [ ] Create axios instance with interceptors

#### 2. Context & Hooks
- [ ] AuthContext (JWT token management)
- [ ] AppContext (global state)
- [ ] useAuth hook
- [ ] useApi hook

#### 3. Core Components
- [ ] Layout components (Header, Sidebar, Footer)
- [ ] Auth components (Login, ChangePassword, MFA)
- [ ] Dashboard component

#### 4. Feature Components
- [ ] Sets components (List, View, Create, Edit, Import, Export)
- [ ] Folders components (List, View, Create, Edit, ManageSets)
- [ ] Flashcards components (Create, Edit)
- [ ] **Study Session** (MOST COMPLEX - exact replica of EJS version)
- [ ] Shares components (MyShares, ShareSet, ShareFolder)
- [ ] Admin components (Dashboard, CreateUser)

#### 5. Styling
- [ ] Copy all CSS from v1.0
- [ ] Ensure mobile-first responsive design
- [ ] 3D flip animation for flashcards
- [ ] Focus mode styles

### Deployment

- [ ] Test migration script with real data
- [ ] Build and test Docker containers
- [ ] Deploy with `docker-compose up`
- [ ] Test on LAN network

## 📝 NEXT IMMEDIATE STEPS

1. **Create User Model** - Start with authentication foundation
2. **Create Auth Routes** - JWT login/logout
3. **Create Set Model** - Basic CRUD
4. **Create Flashcard Model** - Basic CRUD
5. **Create LearningProgress Model** - CRITICAL spaced repetition logic
6. **Create Study Routes** - Connect spaced repetition to API

## 🔥 CRITICAL FEATURES TO PRESERVE

1. **Spaced Repetition Algorithm** (SM-2)
   - Intervals: 1, 3, 7, 15, 30, 60 days
   - Ease factor: 2.5 default, +0.1 correct (max 3.0), -0.2 incorrect (min 1.3)
   - Mastery: 4 consecutive correct = PERMANENT mastered
   - Reset behavior: incorrect resets consecutive_correct but NOT is_mastered

2. **Study Session Features**
   - Filter by: All, Learned, Learning, New, Starred
   - Save filter state to localStorage
   - Multi-choice mode with checkbox/radio
   - Flashcard flip animation
   - Focus mode (LEARN button) - fullscreen study
   - Keyboard shortcuts: L (focus), ESC (exit), Space (flip), Arrows (navigate)
   - Star toggle with immediate UI update
   - Random mode toggle (localStorage)

3. **Import/Export**
   - Custom separators (term/def, notes, flashcard)
   - Special handling: `\t`, `tab`, `\n\n`
   - Preview before import

4. **Sharing System**
   - Clone-based (creates copies)
   - Source tracking (source_set_id, source_folder_id)
   - Update from source (preserves learning progress)
   - Export permission flag

5. **MFA for Admin**
   - Speakeasy TOTP
   - QR code generation
   - Required for admin users

## 🛠️ DEVELOPMENT WORKFLOW

### Local Development
```bash
# Terminal 1: Backend
cd version_2.0/backend
npm install
npm run dev

# Terminal 2: Frontend
cd version_2.0/frontend
npm install
npm run dev

# Terminal 3: PostgreSQL (if not using Docker)
# Or use Docker Compose
```

### Production Deployment
```bash
cd version_2.0
docker-compose up -d
```

### Data Migration
```bash
cd version_2.0/database
npm install
node migrate-sqlite-to-postgres.js \
  /path/to/quizlet.db \
  "postgresql://qi_user:qi_password_2024@localhost:5432/qi_learning_db"
```

---

**Status**: Backend infrastructure ready. Next: Create models and API routes.
