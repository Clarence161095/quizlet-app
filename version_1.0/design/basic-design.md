# Qi Learning App - Basic Design

## 1. System Overview

### Purpose

A flashcard-based learning application with spaced repetition system (SM-2 algorithm) for effective long-term memorization.

### Target Users

- Students studying vocabulary, terms, definitions
- Learners who want to retain information long-term
- Educators managing learning materials

### Core Value Proposition

- **Spaced Repetition**: Scientific learning method for long-term retention
- **Simple & Fast**: No complex UI, focus on learning
- **Flexible Organization**: Folders → Sets → Flashcards hierarchy
- **Multiple Study Modes**: Long-term learning, random practice, focused review
- **Mobile-First**: Optimized for on-the-go learning

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                     (Web Browser)                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Login &    │  │   Manage     │  │    Study     │       │
│  │     MFA      │  │   Content    │  │   Sessions   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS SERVER                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               Authentication Layer                  │    │
│  │  (Passport.js + MFA + Session Management)           │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Route Handlers                     │    │
│  │  (auth, admin, folders, sets, flashcards, study)    │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     Models                          │    │
│  │  (User, Folder, Set, Flashcard, LearningProgress)   │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite DATABASE                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  users   │  │ folders  │  │   sets   │  │flashcards│     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │user_notes│  │ learning │  │  shares  │                   │
│  │          │  │ progress │  │          │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## 3. User Roles

### Regular User

- Create and manage own folders, sets, flashcards
- Study with spaced repetition or random mode
- Add personal notes to flashcards
- Share sets/folders with other users
- Accept and use shared content

### Admin User

- All regular user capabilities
- User management (create, activate/deactivate, delete users)
- Password reset for users
- MFA requirement (Google/Microsoft Authenticator)
- Access to admin panel

## 4. Content Hierarchy

```
User
 │
 ├─── Folder 1
 │     ├─── Set A  ──→  Flashcard 1, 2, 3, ...
 │     ├─── Set B  ──→  Flashcard 4, 5, 6, ...
 │     └─── Set C  ──→  Flashcard 7, 8, 9, ...
 │
 ├─── Folder 2
 │     └─── Set D  ──→  Flashcard 10, 11, ...
 │
 └─── Set E (no folder)  ──→  Flashcard 12, 13, ...
```

**Many-to-Many Relationship** (v1.0.0+):

- A Set can belong to multiple Folders
- A Folder can contain multiple Sets
- Managed via `folder_sets` junction table

## 5. Core Workflows

### 5.1 User Registration & Login

```
┌─────────────┐
│   Visitor   │
└──────┬──────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│ Admin Creates│─────→│ User Account │
│  New User    │      │   Created    │
└──────────────┘      └──────┬───────┘
                             │
                             ▼
                      ┌──────────────┐      ┌──────────────┐
                      │ User Logs In │─────→│  Dashboard   │
                      └──────┬───────┘      └──────────────┘
                             │
                             ▼ (if admin)
                      ┌──────────────┐      ┌──────────────┐
                      │  MFA Setup   │─────→│ MFA Verified │
                      └──────────────┘      └──────────────┘
```

### 5.2 Content Creation

```
User Dashboard
      │
      ├─→ Create Folder → Add Sets to Folder
      │
      └─→ Create Set → Add Flashcards
                │
                ├─→ Manual: One by one
                ├─→ Import: Bulk from text file
                └─→ Multi-choice: Quiz format
```

### 5.3 Study Session Flow

```
Select Study Source (Set or Folder)
      │
      ├─→ Long-term Learning (Spaced Repetition)
      │         │
      │         ├─→ Get Due Cards (based on algorithm)
      │         ├─→ Present Card (flip to reveal answer)
      │         ├─→ User Answers (correct/incorrect)
      │         ├─→ Update Progress (SM-2 algorithm)
      │         └─→ Next Card
      │
      └─→ Random Study
                │
                ├─→ Shuffle All Cards
                ├─→ Present Card
                ├─→ User Reviews
                └─→ Next Card (no progress tracking)
```

## 6. Key Features

### 6.1 Spaced Repetition (SM-2 Algorithm)

**Review Intervals:**

```
New Card → 1 day → 3 days → 7 days → 15 days → 30 days → 60 days → ease_factor * interval
```

**Mastery Status:**

- **New**: Never reviewed (no learning_progress record)
- **Learning**: 1-3 consecutive correct answers
- **Mastered**: ≥ 4 consecutive correct answers (PERMANENT - never resets even on incorrect answers)

**Important**: Once a card reaches "Mastered" status, it stays mastered forever. Incorrect answers will:
- Reset `consecutive_correct` to 0
- Reset `interval_days` to 0 (review immediately)
- Decrease ease factor by 0.2
- But **KEEP** `is_mastered = 1`

**Ease Factor:**

- Starts at 2.5
- Correct answer: +0.1 (max 3.0)
- Incorrect answer: -0.2 (min 1.3)
- Used for calculating intervals after repetition 6

### 6.2 Multiple Study Modes

| Mode | Algorithm | Progress Tracking | Filter Options | Use Case |
|------|-----------|-------------------|----------------|----------|
| Long-term | Spaced Repetition (SM-2) | Yes | Total/Learned/Learning/New/Stars | Memorization for exams |
| Random (All) | Shuffle all cards | No | Total/Learned/Learning/New/Stars | Quick review |
| Random (Starred) | Shuffle starred only | No | Stars only | Focus on difficult cards |

**Study Session Features:**

- **Flashcard Mode**: Flip cards to reveal answers, click Correct/Incorrect
- **Multi-Choice Mode**: Answer with A/B/C/D options (auto-parsed if formatted correctly)
- **Focus Mode**: Press `F` key or click LEARN button to enter fullscreen study mode
  - Hides all UI except: progress bar, flashcard, star button, answer buttons, exit button
  - Exit with top-right button, `F` key, or `ESC` key
  - Desktop: Better spacing and larger text
- **Filtering**: Click stats cards to filter by Total/Learned/Learning/New/Stars
  - Filter persists in localStorage (key: `study_filter_{entityType}_{entityId}`)
  - Auto-switches to available filter if selected filter has no cards
- **Star Toggle**: Click star button in corner to toggle starred status (instant update)

### 6.3 Import/Export

**Import Format:**

```
Term<SEP1>Definition<SEP2>Note
Term<SEP1>Definition<SEP2>Note
...
```

**Customizable Separators:**

- SEP1: Term/Definition separator (default: TAB)
- SEP2: Note separator (default: `||`)
- Flashcard separator (default: newline)

**Multi-choice Format:**

```
Word: Question text?
A. Option 1
B. Option 2
C. Option 3
D. Option 4

Definition: A
```

### 6.4 Sharing System

**Clone-Based Sharing:**

```
Owner's Set/Folder
      │
      │ (share with username)
      ▼
Recipient receives share link
      │
      │ (first access)
      ▼
Clone created in Recipient's account
      │
      ├─→ Can study independently
      ├─→ Has own learning progress
      ├─→ Can update from source (owner's changes)
      └─→ Cannot edit/import if cloned (use "Update from Source" button)
```

**Permissions:**

- **Allow Export**: Owner controls if recipient can export content (checkbox during share)
- **Update from Source**: Recipient can pull latest changes from owner
  - Deletes all current flashcards
  - Re-clones from source
  - Preserves learning progress (flashcard IDs may change but progress remains)
- **Keep Progress**: Recipient's learning progress preserved during updates

**Restrictions for Cloned Sets:**

- Cannot edit flashcards directly (read-only)
- Cannot import new flashcards
- Cannot add flashcards manually
- Must use "Update from Source" to sync with owner's changes
- Can delete entire cloned set/folder if no longer needed

**Share States:**

- **Pending** (`is_accepted = 0`): Share created but not yet accessed by recipient
- **Accepted** (`is_accepted = 1`, clone exists): Recipient has accessed and cloned
- **Accepted but Deleted** (`is_accepted = 1`, clone deleted): Recipient deleted their clone
  - Owner can "Reshare" to reset to pending state

## 7. Data Model

### Core Entities

```
┌─────────────┐
│    Users    │
│─────────────│
│ id          │
│ username    │
│ password    │──┐
│ is_admin    │  │
│ mfa_secret  │  │
└─────────────┘  │
                 │
       ┌─────────┴─────────┬─────────────┬──────────────┐
       ▼                   ▼             ▼              ▼
┌─────────────┐     ┌─────────────┐  ┌──────────┐  ┌──────────┐
│   Folders   │◄───►│    Sets     │  │  Notes   │  │ Progress │
│─────────────│     │─────────────│  │──────────│  │──────────│
│ id          │     │ id          │  │ user_id  │  │ user_id  │
│ user_id     │     │ user_id     │  │ flashcard│  │ flashcard│
│ name        │     │ name        │  │ note     │  │ interval │
└─────────────┘     └─────────────┘  └──────────┘  │ mastered │
       │                   │                       └──────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │ Flashcards  │
       │            │─────────────│
       │            │ id          │
       │            │ set_id      │
       │            │ word        │
       │            │ definition  │
       │            │ is_starred  │
       │            └─────────────┘
       │
       └───────────┐
                   ▼
            ┌──────────────┐
            │ folder_sets  │  (junction table)
            │──────────────│
            │ folder_id    │
            │ set_id       │
            │ added_at     │
            └──────────────┘
```

## 8. Security Model

### Authentication

- Session-based (Express session + Passport.js)
- Passwords hashed with bcrypt (10 rounds)
- MFA for admin accounts (TOTP via Speakeasy)

### Authorization

- Resource ownership check (user_id comparison)
- Admin-only routes protected by middleware
- MFA verification required for admin actions

### Data Protection

- SQL injection protection (prepared statements)
- No direct SQL from user input
- Session stored in SQLite (server-side)
- Environment variables for secrets

## 9. Technology Choices

### Why SQLite?

- ✅ Serverless (no separate DB process)
- ✅ File-based (easy backup/restore)
- ✅ Perfect for EC2 free tier (low resource usage)
- ✅ ACID compliant
- ✅ Good for < 100K flashcards per user
- ❌ Not for distributed systems
- ❌ Limited concurrent writes

### Why Server-Side Rendering (EJS)?

- ✅ Simpler than SPA frameworks
- ✅ Better SEO (if public pages added later)
- ✅ Faster initial page load
- ✅ No build step required
- ✅ Works without JavaScript enabled

### Why Tailwind CSS?

- ✅ Rapid UI development
- ✅ Mobile-first by default
- ✅ Small final CSS size (via CDN)
- ✅ Consistent design system
- ✅ No custom CSS files to maintain

## 10. Deployment Architecture

```
┌─────────────────────────────────────┐
│         AWS EC2 Instance            │
│         (Free Tier: t2.micro)       │
│                                     │
│  ┌──────────────────────────────┐   │
│  │      PM2 Process Manager     │   │
│  │                              │   │
│  │  ┌─────────────────────────┐ │   │
│  │  │   Node.js App (Port 80) │ │   │
│  │  │   - Express Server      │ │   │
│  │  │   - SQLite Database     │ │   │
│  │  └─────────────────────────┘ │   │
│  └──────────────────────────────┘   │
│                                     │
│  File System:                       │
│  /home/ec2-user/quizlet-app/        │
│    ├── src/                         │
│    ├── data/                        │
│    │   ├── quizlet.db               │
│    │   └── sessions.db              │
│    └── .env                         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      AWS Security Group             │
│  - Allow HTTP (Port 80)             │
│  - Allow SSH (Port 22)              │
└─────────────────────────────────────┘
```

## 11. Scalability Considerations

### Current Design (v1.0.0)

- **Users**: Up to 100 concurrent users
- **Flashcards**: Up to 100K per user
- **Database Size**: Up to 1GB (SQLite limit: 140TB)

### Future Improvements

If scaling beyond EC2 free tier:

1. Move to PostgreSQL/MySQL for concurrent writes
2. Add Redis for session storage
3. Use CDN for static assets
4. Implement full-text search (Elasticsearch)
5. Add API layer for mobile apps

## 12. Future Enhancements (Post v1.0.0)

- [ ] Image support for flashcards
- [ ] Audio pronunciation
- [ ] Public sharing (share via link)
- [ ] Leaderboards/gamification
- [ ] Collaborative sets (multiple editors)
- [ ] Statistics dashboard (learning analytics)
- [ ] Mobile app (React Native)
- [ ] Offline mode (PWA)
- [ ] AI-generated flashcards
- [ ] Integration with Anki

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-23
