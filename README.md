# Quizlet Learning App

A complete flashcard learning application with spaced repetition system, similar to Quizlet.

## Features

- ✅ **User Management**: Simple authentication with admin approval
- ✅ **MFA Support**: Google Authenticator/Microsoft Authenticator for admin
- ✅ **Folders & Sets**: Organize flashcards in folders and sets
- ✅ **Flashcards**: Create, edit, delete flashcards with word/definition
- ✅ **Multiple Choice**: Support for quiz-style multiple choice questions
- ✅ **Personal Notes**: User-specific notes for each flashcard (markdown supported)
- ✅ **Spaced Repetition**: Long-term learning based on SM-2 algorithm
  - Cards appear after 1, 3, 7, 15, 30, 60, 90 days
  - Mastered after 7 consecutive correct answers
  - Lower weight for mastered cards
- ✅ **Random Study**: Random practice with all cards or starred cards only
- ✅ **Import/Export**: Import/export flashcards with custom separators
- ✅ **Starred Cards**: Mark favorite cards for quick review
- ✅ **Mobile First**: Responsive design optimized for mobile devices

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite3 (better-sqlite3)
- **Template Engine**: EJS
- **Styling**: Tailwind CSS
- **Authentication**: Passport.js + bcryptjs
- **MFA**: Speakeasy + QRCode
- **Session**: Express-session + connect-sqlite3

## Installation

### Local Development

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd quizlet-app

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Edit .env and set your SESSION_SECRET
nano .env

# 5. Initialize database
npm run init-db

# 6. Start the application
npm start
```

The app will run on `http://localhost:3000`

**Default admin credentials**: `admin` / `admin123`

### Production Deployment (EC2 Free Tier)

```bash
# 1. SSH to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# 2. Install Node.js (if not already installed)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 3. Clone your repository
git clone <your-repo-url>
cd quizlet-app

# 4. Run the boot script
chmod +x boot.sh
./boot.sh
```

## Project Structure

```
quizlet-app/
├── src/
│   ├── config/
│   │   └── passport.js          # Passport authentication config
│   ├── database/
│   │   └── init.js              # Database initialization
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Folder.js            # Folder model
│   │   ├── Set.js               # Set model
│   │   ├── Flashcard.js         # Flashcard model
│   │   ├── LearningProgress.js  # Spaced repetition model
│   │   └── UserNote.js          # User notes model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── admin.js             # Admin panel routes
│   │   ├── dashboard.js         # Dashboard routes
│   │   ├── folders.js           # Folder management
│   │   ├── sets.js              # Set management
│   │   ├── flashcards.js        # Flashcard management
│   │   └── study.js             # Study session routes
│   ├── views/
│   │   ├── layout.ejs           # Main layout template
│   │   ├── auth/                # Authentication views
│   │   ├── dashboard/           # Dashboard views
│   │   ├── admin/               # Admin panel views
│   │   ├── folders/             # Folder views
│   │   ├── sets/                # Set views
│   │   ├── flashcards/          # Flashcard views
│   │   └── study/               # Study session views
│   └── server.js                # Main server file
├── data/
│   ├── quizlet.db              # SQLite database (auto-created)
│   └── sessions.db             # Session storage (auto-created)
├── public/
│   └── (static assets)
├── package.json
├── .env.example
├── .gitignore
├── boot.sh                     # Production boot script
└── README.md
```

## Usage Guide

### First Time Setup

1. Login with default admin credentials: `admin` / `admin123`
2. Setup MFA (required for admin)
3. Change your password
4. Create users from Admin panel

### Creating Flashcards

**Method 1: Manual Creation**
1. Create a Folder (optional)
2. Create a Set
3. Add Flashcards one by one

**Method 2: Bulk Import**
1. Create a Set
2. Go to Import
3. Enter flashcards in format:
   ```
   Word1<TAB>Definition1
   Word2<TAB>Definition2
   ```
4. Customize separators if needed
5. Preview and import

**Method 3: Multiple Choice Questions**
```
Word: What is the capital of Vietnam?
A. Hanoi
B. Ho Chi Minh
C. Da Nang
D. Hue

Definition: A
```

### Study Modes

**Long-term Learning** (Spaced Repetition)
- Cards appear based on your memory performance
- Intervals: 1, 3, 7, 15, 30, 60, 90 days
- Mark as mastered after 7 consecutive correct answers

**Random Study**
- Practice all cards in random order
- Filter by starred cards only
- Good for quick review

### Personal Notes

- Add markdown notes to any flashcard
- Notes are private to your account
- Great for additional context or mnemonics

## Database Schema

### Users
- id, username, password, email, is_admin, is_active, mfa_secret, mfa_enabled

### Folders
- id, user_id, name, description

### Sets
- id, user_id, folder_id, name, description

### Flashcards
- id, set_id, word, definition, is_starred

### User Notes
- id, user_id, flashcard_id, note

### Learning Progress
- id, user_id, flashcard_id, ease_factor, interval_days, repetitions
- next_review_date, last_review_date, consecutive_correct, is_mastered

## API Endpoints

### Authentication
- `GET /auth/login` - Login page
- `POST /auth/login` - Login submit
- `GET /auth/mfa-setup` - MFA setup
- `POST /auth/mfa-setup` - MFA setup submit
- `GET /auth/mfa-verify` - MFA verification
- `POST /auth/mfa-verify` - MFA verification submit
- `GET /auth/change-password` - Change password page
- `POST /auth/change-password` - Change password submit
- `GET /auth/logout` - Logout

### Dashboard
- `GET /dashboard` - Main dashboard

### Admin
- `GET /admin` - Admin panel
- `GET /admin/users/create` - Create user page
- `POST /admin/users/create` - Create user submit
- `POST /admin/users/:id/toggle-active` - Toggle user active status
- `POST /admin/users/:id/delete` - Delete user
- `POST /admin/users/:id/reset-password` - Reset user password

### Folders
- `GET /folders` - List folders
- `GET /folders/create` - Create folder page
- `POST /folders/create` - Create folder submit
- `GET /folders/:id` - View folder
- `GET /folders/:id/edit` - Edit folder page
- `POST /folders/:id/edit` - Edit folder submit
- `POST /folders/:id/delete` - Delete folder
- `GET /folders/:id/study` - Study folder (long-term)
- `GET /folders/:id/random` - Random study folder

### Sets
- `GET /sets` - List sets
- `GET /sets/create` - Create set page
- `POST /sets/create` - Create set submit
- `GET /sets/:id` - View set
- `GET /sets/:id/edit` - Edit set page
- `POST /sets/:id/edit` - Edit set submit
- `POST /sets/:id/delete` - Delete set
- `GET /sets/:id/import` - Import flashcards page
- `POST /sets/:id/import` - Import flashcards submit
- `GET /sets/:id/export` - Export flashcards
- `GET /sets/:id/study` - Study set (long-term)
- `GET /sets/:id/random` - Random study set

### Flashcards
- `GET /flashcards/create/:setId` - Create flashcard page
- `POST /flashcards/create/:setId` - Create flashcard submit
- `GET /flashcards/:id/edit` - Edit flashcard page
- `POST /flashcards/:id/edit` - Edit flashcard submit
- `POST /flashcards/:id/toggle-star` - Toggle star
- `POST /flashcards/:id/delete` - Delete flashcard

### Study
- `POST /study/answer` - Submit answer

## Environment Variables

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-secret-key-here-change-this-in-production
APP_NAME=Quizlet Learning App
```

## Security Features

- Password hashing with bcryptjs
- MFA support for admin accounts
- Session-based authentication
- CSRF protection (via method-override)
- SQL injection protection (prepared statements)
- User approval system

## Performance Optimization

- SQLite for lightweight database
- Session storage in SQLite
- Minimal dependencies
- Optimized for EC2 free tier (1GB RAM)
- No heavy frameworks or ORMs

## Troubleshooting

**Cannot login**
- Check username/password
- Ensure user is active (admin must approve)

**MFA not working**
- Ensure your device time is synchronized
- Try re-scanning QR code

**Database errors**
- Run `npm run init-db` to reinitialize
- Check data/ folder permissions

**Port already in use**
- Change PORT in .env file
- Or stop other services using port 3000

## License

MIT

## Support

For issues and questions, please create an issue in the repository.