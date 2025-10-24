# QI LEARNING APP V2.0 - QUICK START GUIDE

## 🎯 MIGRATION STATUS: 40% COMPLETE

### ✅ What's Done
1. ✅ Project structure (version_1.0 + version_2.0)
2. ✅ Docker Compose configuration
3. ✅ PostgreSQL schema
4. ✅ Data migration script
5. ✅ Nginx reverse proxy config
6. ✅ Backend infrastructure (database connection, JWT auth)
7. ✅ User model (authentication foundation)

### 🚧 What's Next (TO CONTINUE)

Tôi đã setup xong 40% infrastructure. Để hoàn thành migration, bạn cần:

## STEP 1: Complete Backend Models

Tạo các file models còn lại trong `backend/src/models/`:

### Set.js (Priority 1)
```javascript
// Copy logic từ version_1.0/src/models/Set.js
// Đổi từ SQLite synchronous sang PostgreSQL async/await
// Example:
// OLD: db.prepare('SELECT * FROM sets WHERE id = ?').get(id)
// NEW: await queryOne('SELECT * FROM sets WHERE id = $1', [id])
```

### Folder.js (Priority 1)
```javascript
// Copy logic từ version_1.0/src/models/Folder.js
// Quan trọng: Many-to-many relationship với sets qua folder_sets table
```

### Flashcard.js (Priority 1)
```javascript
// Copy logic từ version_1.0/src/models/Flashcard.js
// Xử lý order_index, is_starred, images
```

### LearningProgress.js (Priority 1 - CRITICAL!)
```javascript
// ⚠️ QUAN TRỌNG NHẤT - Spaced Repetition Algorithm
// Copy CHÍNH XÁC 100% logic từ version_1.0/src/models/LearningProgress.js
// Intervals: 1, 3, 7, 15, 30, 60 days
// Mastery = 4 consecutive correct (NEVER resets)
// Ease factor: 2.5 default, +0.1 correct, -0.2 incorrect
```

### UserNote.js (Priority 2)
### Share.js (Priority 2) - Hoặc split thành SetShare.js và FolderShare.js

## STEP 2: Complete Backend Routes

Tạo các file routes trong `backend/src/routes/`:

### auth.js (Priority 1)
```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    
    if (!user || !await User.verifyPassword(password, user.password)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is disabled' 
      });
    }

    // If admin with MFA enabled, require MFA
    if (user.is_admin && user.mfa_enabled) {
      // Return temporary token requiring MFA
      return res.json({
        success: true,
        requireMFA: true,
        tempUserId: user.id
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.is_admin,
        first_login: user.first_login,
        must_change_password: user.must_change_password
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Implement các routes khác: /mfa-verify, /change-password, /me, etc.
```

### sets.js, folders.js, flashcards.js, study.js, shares.js, admin.js
Copy logic từ version_1.0 nhưng chuyển sang RESTful API format

## STEP 3: Create Main Server File

`backend/src/server.js`:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sets', require('./routes/sets'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/study', require('./routes/study'));
app.use('/api/shares', require('./routes/shares'));
app.use('/api/admin', require('./routes/admin'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Backend API running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});
```

## STEP 4: Initialize Frontend (React + Vite)

```bash
cd version_2.0/frontend
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios tailwindcss postcss autoprefixer
npm install @heroicons/react
npx tailwindcss init -p
```

### Frontend Structure to Create:
```
frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   ├── MfaSetup.jsx
│   │   │   └── MfaVerify.jsx
│   │   ├── Dashboard/
│   │   │   └── Dashboard.jsx
│   │   ├── Sets/
│   │   │   ├── SetsList.jsx
│   │   │   ├── SetView.jsx
│   │   │   ├── SetCreate.jsx
│   │   │   ├── SetEdit.jsx
│   │   │   ├── SetImport.jsx
│   │   │   └── SetExport.jsx
│   │   ├── Folders/ (similar to Sets)
│   │   ├── Flashcards/ (Create, Edit)
│   │   ├── Study/
│   │   │   └── StudySession.jsx (MOST COMPLEX!)
│   │   ├── Shares/
│   │   └── Admin/
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   ├── services/
│   │   └── api.js (Axios instance)
│   └── styles/
│       └── index.css (Tailwind + custom CSS)
```

## STEP 5: Test & Deploy

### Test Migration Script
```bash
cd version_2.0/database
npm install
node migrate-sqlite-to-postgres.js \
  ../../version_1.0/data/quizlet.db \
  "postgresql://qi_user:qi_password_2024@localhost:5432/qi_learning_db"
```

### Run Development
```bash
# Terminal 1: Start PostgreSQL
docker run -d \
  --name qi-postgres \
  -e POSTGRES_USER=qi_user \
  -e POSTGRES_PASSWORD=qi_password_2024 \
  -e POSTGRES_DB=qi_learning_db \
  -p 5432:5432 \
  postgres:15-alpine

# Terminal 2: Backend
cd version_2.0/backend
cp .env.example .env
npm install
npm run dev

# Terminal 3: Frontend
cd version_2.0/frontend
npm install
npm run dev
```

### Production Deployment
```bash
cd version_2.0
docker-compose up -d
```

## 🎨 STYLING GUIDE

Copy CSS from version_1.0:
- Tailwind config từ `version_1.0/src/views/`
- 3D flip animation cho flashcards
- Focus mode styles
- Mobile-first responsive breakpoints
- Custom xs: breakpoint (475px)

## 🔥 CRITICAL REMINDERS

1. **Spaced Repetition Algorithm** - Copy CHÍNH XÁC từ LearningProgress.js
2. **Study Session** - Component phức tạp nhất, cần replicate 100% functionality
3. **Import/Export** - Custom separators, special character handling
4. **Sharing** - Clone-based system, source tracking
5. **MFA** - Admin only, Speakeasy TOTP
6. **Mobile-first** - Always design for mobile first

## 📚 REFERENCES

- Version 1.0 code: `version_1.0/`
- Migration plan: `MIGRATION_PLAN.md`
- Progress tracker: `MIGRATION_STATUS.md`
- Database schema: `database/init.sql`
- API documentation: See MIGRATION_STATUS.md

## 🆘 IF YOU NEED HELP

Tôi đã setup 40% infrastructure. Phần còn lại là:
1. Complete backend models (20%)
2. Complete backend routes (20%)
3. Create React frontend (15%)
4. Test & deploy (5%)

Bạn có thể tiếp tục từng phần hoặc yêu cầu tôi tiếp tục tạo các file cụ thể!

---

**Next Command to Continue:**
```bash
# Tôi có thể tiếp tục tạo các models và routes còn lại nếu bạn muốn
```
