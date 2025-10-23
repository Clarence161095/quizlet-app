# Changelog

All notable changes to the Qi Learning App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-23

### 🎉 Initial Release

First production-ready release of Qi Learning App!

### ✨ Features

#### Core Learning System
- **Spaced Repetition System** - SM-2 algorithm implementation
  - Review intervals: 1, 3, 7, 15, 30, 60, 90+ days
  - Automatic mastery tracking (7 consecutive correct answers)
  - Adaptive difficulty with ease factor adjustment
  - Separate queuing for mastered cards
  
- **Multiple Study Modes**
  - Long-term learning with spaced repetition
  - Random practice (all cards)
  - Random practice (starred cards only)
  - Focus mode (distraction-free fullscreen)

- **Content Organization**
  - Hierarchical structure: Folders → Sets → Flashcards
  - Many-to-many folder-set relationships
  - Personal notes for each flashcard (Markdown supported)
  - Star/favorite cards for quick access

#### Advanced Features
- **Import/Export System**
  - Bulk import with customizable separators
  - Multi-choice quiz format support
  - Preview before import
  - Export to plain text with notes

- **Sharing System**
  - Share sets/folders with other users
  - Clone-based sharing (independent copies)
  - Update from source (pull latest changes)
  - Export permission control
  - Source tracking for cloned content

- **User Management**
  - Session-based authentication (Passport.js)
  - Multi-Factor Authentication (MFA) for admin accounts
  - User activation/deactivation
  - Password reset by admin
  - Bcrypt password hashing

#### UI/UX
- Mobile-first responsive design
- 3D flip animation for flashcards
- Real-time statistics cards with filters
- Clickable filter badges (Total/Mastered/Learning/New/Stars)
- Filter state persistence in localStorage
- Focus mode keyboard shortcuts (F, ESC)
- Star toggle with smooth animations

### 🛠️ Technical

#### Architecture
- **Backend**: Node.js 18+ with Express.js
- **Database**: SQLite 3 (better-sqlite3, synchronous API)
- **Views**: EJS templates with express-ejs-layouts
- **Styling**: Tailwind CSS (CDN)
- **Authentication**: Passport.js + bcryptjs
- **MFA**: Speakeasy (TOTP) + QRCode
- **Session**: Express-session + connect-sqlite3

#### Database Schema
- 11 tables with proper foreign key relationships
- Many-to-many folder-set junction table
- Source tracking columns for shared content
- Export permission flags
- Optimized indexes for common queries

#### Security
- SQL injection protection (prepared statements)
- Session-based authentication
- MFA requirement for admin accounts
- Password hashing with bcrypt (10 rounds)
- HttpOnly session cookies
- Environment variables for secrets

### 📚 Documentation

- **README.md** - Comprehensive project overview
- **DEVELOPMENT.md** - Complete development guide
- **DEPLOYMENT.md** - AWS EC2 deployment instructions
- **src/database/MIGRATION.md** - Database schema and migration guide
- **src/database/README.md** - Database usage documentation
- **src/models/README.md** - Data model documentation
- **src/routes/README.md** - Route/API documentation
- **design/basic-design.md** - High-level architecture
- **design/detailed-design.md** - Detailed technical design with ASCII diagrams

### 🚀 Deployment

- **init-deploy.sh** - Automated initial deployment script
- **update-deploy.sh** - Automated update deployment script
- **boot.sh** - Legacy bootstrap script (kept for compatibility)
- PM2 process manager integration
- Port 80 configuration for production
- Automatic firewall configuration

### 🗂️ Project Structure

- Cleaned up development artifacts
- Merged all database migrations into single `init.js`
- Removed obsolete feature documentation files
- Organized documentation by purpose
- README files in each major folder

### 📋 Database Schema v1.0.0

Complete schema with:
- users (authentication & MFA)
- folders (content organization)
- sets (flashcard collections)
- flashcards (learning content)
- folder_sets (many-to-many junction)
- user_notes (personal annotations)
- learning_progress (spaced repetition tracking)
- study_sessions (session metadata)
- study_answers (answer history)
- set_shares (set sharing)
- folder_shares (folder sharing)

### 🔧 Configuration

- `.env.example` - Environment template
- Default admin user: `admin` / `admin123`
- Configurable session secret
- Configurable port (default: 3000, production: 80)

### 📦 Dependencies

**Production:**
- express ^4.18.2
- ejs ^3.1.9
- better-sqlite3 ^9.2.2
- passport ^0.6.0
- bcryptjs ^2.4.3
- speakeasy ^2.0.0
- qrcode ^1.5.3
- And more...

**Development:**
- nodemon ^3.0.2

### 🐛 Known Issues

None at release time.

### ⚠️ Breaking Changes

None (initial release).

### 🔄 Migration Notes

**From Development to v1.0.0:**
- All previous migration files merged into `init.js`
- Database automatically includes all features
- Fresh install: Run `npm run init-db`
- Existing database: Compatible, no migration needed

### 📝 Notes

- Default admin password MUST be changed after first login
- MFA is required for admin accounts
- Session secret should be changed in production
- Database backups recommended before major updates

---

## [Unreleased]

### Planned Features
- Image support for flashcards
- Audio pronunciation
- Public sharing (share via link)
- Statistics dashboard with charts
- Export to Anki format
- Mobile app (React Native)
- Offline mode (PWA)
- AI-generated flashcards

---

## Release Process

### Version Format
- **MAJOR.MINOR.PATCH** (Semantic Versioning)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Checklist
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Run tests
- [ ] Update documentation
- [ ] Create git tag
- [ ] Deploy to production

---

**For more details, see:**
- [README.md](README.md) - Project overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide

[1.0.0]: https://github.com/your-username/quizlet-app/releases/tag/v1.0.0
