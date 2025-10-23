# Qi Learning App

<div align="center">

**A powerful flashcard learning application with spaced repetition for effective long-term memorization**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-repo/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Deployment](#deployment)

</div>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Qi Learning App is a comprehensive flashcard-based learning system designed to help students and learners retain information effectively using the scientifically-proven **SM-2 spaced repetition algorithm**. Built with simplicity and efficiency in mind, it runs on minimal resources and is perfect for deployment on AWS EC2 free tier.

### Why Qi Learning App?

- ✅ **Scientifically Proven**: Uses SM-2 algorithm for optimal long-term retention
- ✅ **Mobile-First Design**: Fully responsive, optimized for learning on-the-go
- ✅ **Lightweight**: Runs efficiently on free-tier cloud instances
- ✅ **Privacy-Focused**: Self-hosted, your data stays with you
- ✅ **Simple & Fast**: No complex UI, focus on learning
- ✅ **Flexible Organization**: Hierarchical folder/set structure

## ✨ Features

### Core Learning Features

- **🎯 Spaced Repetition System**
  - SM-2 algorithm implementation
  - Intervals: 1, 3, 7, 15, 30, 60, 90+ days
  - Automatic mastery tracking (7 consecutive correct)
  - Adaptive difficulty (ease factor adjustment)

- **📚 Study Modes**
  - **Long-term Learning**: Spaced repetition for memorization
  - **Random Practice**: Shuffle all cards or starred cards only
  - **Focus Mode**: Distraction-free fullscreen study

- **🗂️ Content Organization**
  - Hierarchical structure: Folders → Sets → Flashcards
  - Many-to-many folder-set relationships
  - Starred cards for quick access
  - Personal notes for each flashcard (Markdown supported)

### Advanced Features

- **📥 Bulk Import/Export**
  - Customizable separators (term/definition, notes)
  - Multi-choice quiz format support
  - Preview before import
  - Plain text export

- **🤝 Sharing System**
  - Share sets/folders with other users
  - Clone-based sharing (independent copies)
  - Update from source (pull latest changes)
  - Export permission control

- **🔐 Security & Authentication**
  - Session-based authentication
  - Multi-Factor Authentication (MFA) for admins
  - Bcrypt password hashing
  - SQL injection protection

- **👥 User Management** (Admin)
  - Create and manage users
  - Activate/deactivate accounts
  - Password reset
  - Admin-only panel with MFA requirement

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js + Express.js |
| **Database** | SQLite 3 (better-sqlite3) |
| **Template Engine** | EJS |
| **Styling** | Tailwind CSS (CDN) |
| **Authentication** | Passport.js + bcryptjs |
| **MFA** | Speakeasy + QRCode |
| **Session Storage** | connect-sqlite3 |
| **Process Manager** | PM2 (production) |

### Why These Technologies?

- **SQLite**: Serverless, file-based, perfect for single-server deployment
- **EJS**: Simple server-side rendering, no build step required
- **Tailwind CSS**: Rapid UI development with mobile-first approach
- **Better-sqlite3**: Synchronous API for simplicity and reliability

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- Git

### Installation (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/quizlet-app.git
cd quizlet-app

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env and set SESSION_SECRET
# Generate a random secret: openssl rand -base64 32
nano .env

# 5. Initialize database
npm run init-db

# 6. Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

**Default admin credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change the admin password immediately after first login!**

### Quick Deploy (AWS EC2)

```bash
# SSH to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Clone and deploy
git clone https://github.com/your-username/quizlet-app.git
cd quizlet-app
chmod +x init-deploy.sh
./init-deploy.sh
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
quizlet-app/
├── src/
│   ├── server.js              # Main Express application
│   ├── config/
│   │   └── passport.js        # Passport authentication config
│   ├── database/
│   │   ├── init.js            # Database initialization
│   │   ├── MIGRATION.md       # Database migration guide
│   │   └── README.md          # Database documentation
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── models/                # Data models (Active Record pattern)
│   │   ├── User.js
│   │   ├── Folder.js
│   │   ├── Set.js
│   │   ├── Flashcard.js
│   │   ├── LearningProgress.js
│   │   ├── UserNote.js
│   │   └── README.md
│   ├── routes/                # Express route handlers
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── dashboard.js
│   │   ├── folders.js
│   │   ├── sets.js
│   │   ├── flashcards.js
│   │   ├── study.js
│   │   ├── shares.js
│   │   └── README.md
│   ├── views/                 # EJS templates
│   │   ├── layout.ejs
│   │   └── ...
│   └── helpers/
│       └── viewHelper.js
├── data/                      # SQLite databases (created on init)
│   ├── quizlet.db
│   └── sessions.db
├── design/                    # Design documentation
│   ├── basic-design.md
│   └── detailed-design.md
├── public/                    # Static assets
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment template
├── package.json
├── init-deploy.sh             # Initial deployment script
├── update-deploy.sh           # Update deployment script
├── README.md                  # This file
├── DEVELOPMENT.md             # Development guide
└── DEPLOYMENT.md              # Deployment guide
```

## 📚 Documentation

### User Documentation

- **[Usage Guide](#usage-guide)** - How to use the app

### Developer Documentation

- **[Development Guide](DEVELOPMENT.md)** - Setup and development workflow
- **[Database Guide](src/database/README.md)** - Database schema and access patterns
- **[Models Guide](src/models/README.md)** - Data model documentation
- **[Routes Guide](src/routes/README.md)** - API endpoints and route handlers
- **[Database Migration](src/database/MIGRATION.md)** - Schema changes and migration

### Design Documentation

- **[Basic Design](design/basic-design.md)** - High-level architecture and features
- **[Detailed Design](design/detailed-design.md)** - In-depth technical design with diagrams

## 🌐 Deployment

### Option 1: Automated Deployment (Recommended)

For AWS EC2 or similar Linux servers:

```bash
# Initial deployment
./init-deploy.sh

# Update deployment (after code changes)
./update-deploy.sh
```

### Option 2: Manual Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- AWS EC2 free tier setup
- Port configuration (port 80)
- PM2 process management
- Security group settings
- Database backup strategies

## 📖 Usage Guide

### Creating Your First Set

1. **Login** with admin credentials
2. **Setup MFA** (required for admin, scan QR code)
3. **Change password** (security best practice)
4. **Create a folder** (optional, for organization)
5. **Create a set**
6. **Add flashcards** (manual, import, or multi-choice)

### Importing Flashcards

**Format:**
```
Term<TAB>Definition||Note
Term<TAB>Definition
```

**Multi-Choice Format:**
```
Word: What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid

Definition: B
```

### Studying

**Long-term Learning (Spaced Repetition):**
- Click "LEARN" on any set/folder
- Review due cards based on SM-2 algorithm
- Answer "Know" or "Don't Know"

**Random Study:**
- Click "RANDOM" on any set/folder
- Shuffle all cards or starred cards only

**Focus Mode:**
- Press `F` key during study
- Exit with `F`, `ESC`, or exit button

## 💻 Development

```bash
# Start with auto-reload (nodemon)
npm run dev

# Start production mode
npm start

# Initialize/reset database
npm run init-db
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development workflow.

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring

## 📋 Roadmap

### v1.0.0 (Current) ✅
- [x] Spaced repetition system (SM-2)
- [x] Import/export with custom separators
- [x] Sharing system
- [x] Focus mode
- [x] MFA for admin

### Future
- [ ] Image support for flashcards
- [ ] Mobile app (React Native)
- [ ] AI-generated flashcards
- [ ] Export to Anki

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **SM-2 Algorithm**: Based on SuperMemo 2 by Piotr Woźniak
- **Tailwind CSS**: For the amazing utility-first CSS framework
- **Express.js**: For the robust web framework

---

<div align="center">

**Built with ❤️ for effective learning**

[⬆ Back to Top](#qi-learning-app)

</div>
