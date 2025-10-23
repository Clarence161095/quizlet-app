# Qi Learning App - Detailed Design

## Table of Contents

1. [Authentication System](#1-authentication-system)
2. [Content Management](#2-content-management)
3. [Study Session System](#3-study-session-system)
4. [Spaced Repetition Algorithm](#4-spaced-repetition-algorithm)
5. [Sharing System](#5-sharing-system)
6. [Import/Export System](#6-importexport-system)
7. [UI/UX Design](#7-uiux-design)
8. [Database Design](#8-database-design)
9. [API Endpoints](#9-api-endpoints)
10. [Security Implementation](#10-security-implementation)

---

## 1. Authentication System

### 1.1 Login Flow

```
┌──────────────────────────────────────────────────────────┐
│                     LOGIN PROCESS                        │
└──────────────────────────────────────────────────────────┘

User Input (username + password)
         │
         ▼
┌─────────────────────┐
│  Passport.js Local  │
│   Strategy Check    │
└──────────┬──────────┘
           │
           ├──[Invalid]──→ Show Error → Redirect to /auth/login
           │
           ▼ [Valid]
┌─────────────────────┐
│  Create Session     │
│  (Express Session)  │
└──────────┬──────────┘
           │
           ▼
      Is Admin?
           │
           ├──[No]──→ Redirect to /dashboard
           │
           ▼ [Yes]
      MFA Enabled?
           │
           ├──[No]──→ Redirect to /auth/mfa-setup (required)
           │
           ▼ [Yes]
┌─────────────────────┐
│ Redirect to MFA     │
│  Verification       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ User enters TOTP    │
│  (6-digit code)     │
└──────────┬──────────┘
           │
           ├──[Invalid]──→ Show Error
           │
           ▼ [Valid]
┌─────────────────────┐
│ Set session flag:   │
│ mfaVerified = true  │
└──────────┬──────────┘
           │
           ▼
    Redirect to /dashboard
```

### 1.2 MFA Setup Flow (Admin Only)

```
┌────────────────────────────────────────┐
│         MFA SETUP PROCESS              │
└────────────────────────────────────────┘

Admin First Login (MFA not enabled)
         │
         ▼
┌─────────────────────────────────┐
│ Generate TOTP Secret            │
│ (Speakeasy.generateSecret)      │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Generate QR Code                │
│ (QRCode.toDataURL)              │
│                                 │
│ ┌─────────────────────────┐     │
│ │  ████  ██    ████  ████ │     │
│ │  ████  ██  ██████  ████ │     │
│ │  ████████  ████    ████ │     │
│ │    ██████  ██  ████████ │     │
│ │  ████  ██    ████  ████ │     │
│ └─────────────────────────┘     │
│                                 │
│ Secret: JBSWY3DPEHPK3PXP        │
└──────────┬──────────────────────┘
           │
           ▼
User Scans QR with Authenticator App
(Google Authenticator, Microsoft Authenticator)
           │
           ▼
┌─────────────────────────────────┐
│ User Enters Verification Code   │
└──────────┬──────────────────────┘
           │
           ├──[Invalid]──→ Show Error
           │
           ▼ [Valid]
┌─────────────────────────────────┐
│ Save Secret to Database         │
│ Set mfa_enabled = 1             │
└──────────┬──────────────────────┘
           │
           ▼
    MFA Setup Complete
```

### 1.3 Session Management

```
Session Data Structure:
{
  passport: {
    user: userId  // Set by Passport.js after successful login
  },
  mfaVerified: true/false,  // For admin users
  flash: {
    success: 'message',
    error: 'message',
    info: 'message'
  }
}

Storage: SQLite (data/sessions.db)
Lifetime: 7 days (configurable)
```

---

## 2. Content Management

### 2.1 Folder-Set Many-to-Many Relationship

```
┌────────────────────────────────────────────────────────────┐
│           FOLDER-SET RELATIONSHIP (v1.0.0)                 │
└────────────────────────────────────────────────────────────┘

Folder 1 "Spanish"         Folder 2 "Vocabulary"
    │                           │
    ├───→ Set A "Numbers"  ◄────┤
    │                           │
    ├───→ Set B "Colors"        │
    │                           │
    └───→ Set C "Animals" ◄─────┘

Implemented via folder_sets junction table:
┌──────────────────────────────┐
│ folder_sets                  │
├──────────────────────────────┤
│ folder_id | set_id | added_at│
├──────────────────────────────┤
│     1     │   A    │ 2025... │  ← Folder 1 → Set A
│     2     │   A    │ 2025... │  ← Folder 2 → Set A
│     1     │   B    │ 2025... │  ← Folder 1 → Set B
│     1     │   C    │ 2025... │  ← Folder 1 → Set C
│     2     │   C    │ 2025... │  ← Folder 2 → Set C
└──────────────────────────────┘
```

### 2.2 Flashcard Creation Flow

```
┌────────────────────────────────────────────────────────────┐
│              FLASHCARD CREATION METHODS                    │
└────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ METHOD 1: MANUAL │
└──────────────────┘

User → Create Flashcard Form
         │
         ▼
┌────────────────────────────────┐
│ Word: hello                    │
│ Definition: a greeting         │
│ [Create] button                │
└─────────┬──────────────────────┘
          │
          ▼
INSERT INTO flashcards (set_id, word, definition)


┌──────────────────┐
│ METHOD 2: IMPORT │
└──────────────────┘

User → Import Form
         │
         ▼
┌────────────────────────────────┐
│ Separator Config:              │
│  Term/Def: [TAB]               │
│  Note: [||]                    │
│  Flashcard: [newline]          │
├────────────────────────────────┤
│ Text Input:                    │
│                                │
│ hello<TAB>greeting||note1      │
│ world<TAB>planet||note2        │
│ sky<TAB>above us               │
│                                │
│ [Preview] [Import]             │
└─────────┬──────────────────────┘
          │
          ▼
┌────────────────────────────────┐
│ Parse & Preview:               │
│ ✓ hello → greeting (note1)     │
│ ✓ world → planet (note2)       │
│ ✓ sky → above us               │
│                                │
│ [Confirm Import]               │
└─────────┬──────────────────────┘
          │
          ▼
Transaction BEGIN
  INSERT INTO flashcards (...)
  INSERT INTO flashcards (...)
  INSERT INTO flashcards (...)
Transaction COMMIT


┌────────────────────────┐
│ METHOD 3: MULTI-CHOICE │
└────────────────────────┘

User → Create Flashcard Form
         │
         ▼
┌────────────────────────────────┐
│ Word:                          │
│ What is the capital of France? │
│ A. London                      │
│ B. Paris                       │
│ C. Berlin                      │
│ D. Madrid                      │
│                                │
│ Definition: B                  │
│                                │
│ [Create]                       │
└─────────┬──────────────────────┘
          │
          ▼
Stored as regular flashcard
(multi-choice rendering in study view)
```

---

## 3. Study Session System

### 3.1 Study Mode Selection

```
┌──────────────────────────────────────────────────────────┐
│              STUDY SESSION SELECTION                     │
└──────────────────────────────────────────────────────────┘

User views Set/Folder
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Set: "Spanish Vocabulary"                          │
│  50 flashcards │ 20 mastered │ 30 learning          │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │    LEARN     │  │    RANDOM    │                 │
│  │  (Due: 15)   │  │  (All: 50)   │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                     │
│  Filter: [All] [Mastered] [Learning] [Stars]        │
└─────────────────────────────────────────────────────┘
         │
         ├──[LEARN]──→ Spaced Repetition Mode
         │
         └──[RANDOM]──→ Random Practice Mode
```

### 3.2 Long-Term Study Session (Spaced Repetition)

```
┌──────────────────────────────────────────────────────────┐
│         SPACED REPETITION STUDY SESSION                  │
└──────────────────────────────────────────────────────────┘

Start Session (User clicks "LEARN" button)
     │
     ▼
┌─────────────────────────────────────────┐
│ Query Due Flashcards:                   │
│ SELECT f.*, lp.*                        │
│ FROM flashcards f                       │
│ LEFT JOIN learning_progress lp          │
│   ON f.id = lp.flashcard_id             │
│   AND lp.user_id = ?                    │
│ WHERE f.set_id = ?                      │
│ AND (lp.next_review_date IS NULL        │
│      OR lp.next_review_date <= NOW())   │
│ ORDER BY lp.is_mastered ASC,            │
│          lp.next_review_date ASC        │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Initialize Study UI:                    │
│ - Stats Cards: Total/Learned/Learning/  │
│   New/Stars (all clickable filters)     │
│ - Mode Selector: [Flashcard] [Multi]    │
│ - Progress Bar: 1/15                    │
│ - LEARN Button: Enter Focus Mode        │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Flashcard Display (Card 1/15)           │
│                                         │
│ Filter: Showing All Cards               │
│ Progress: ████████░░░░░░░ 1/15          │
│ ┌─────────────────────────────────────┐ │
│ │              (star button in corner)│ │
│ │                                     │ │
│ │         TERM                        │ │
│ │         hello                       │ │
│ │                                     │ │
│ │      [Click to flip]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Prev] [Incorrect] [Correct] [Next]     │
└──────────┬──────────────────────────────┘
           │
           ├──[Click Flashcard]──→ Flip to show definition
           │
           ├──[Click Star]──→ Toggle starred status
           │
           ├──[Click Stats Card]──→ Filter by status
           │
           ├──[Press F or LEARN]──→ Enter Focus Mode:
           │         │
           │         ▼
           │  ┌──────────────────────────────┐
           │  │ FOCUS MODE (Fullscreen-like) │
           │  │ - Hide header, stats, mode   │
           │  │ - Compact progress bar       │
           │  │ - Large flashcard            │
           │  │ - Answer buttons only        │
           │  │ - [Exit] button top-right    │
           │  │ - Press ESC/F to exit        │
           │  └──────────────────────────────┘
           │
           ├──[Correct]──→ POST /study/answer
           │         │      { flashcard_id, is_correct: true }
           │         ▼
           │  LearningProgress.updateProgress(user_id, flashcard_id, true)
           │         │
           │         ├─→ Increase consecutive_correct
           │         ├─→ Calculate new interval (1→3→7→15→30→60)
           │         ├─→ If consecutive >= 4: is_mastered = 1
           │         ├─→ Set next_review_date
           │         └─→ Update stats in real-time
           │
           └──[Incorrect]──→ POST /study/answer
                     │        { flashcard_id, is_correct: false }
                     ▼
           LearningProgress.updateProgress(user_id, flashcard_id, false)
                     │
                     ├─→ Reset consecutive_correct = 0
                     ├─→ Reset interval = 0 (immediate review)
                     ├─→ KEEP is_mastered (if already mastered)
                     ├─→ Decrease ease_factor
                     └─→ Update stats in real-time
                            │
                            ▼
                  Next Flashcard (or end session)
```

### 3.3 Random Study Session

```
┌──────────────────────────────────────────────────────────┐
│             RANDOM STUDY SESSION                         │
│          (No Progress Tracking)                          │
└──────────────────────────────────────────────────────────┘

Start Session (User clicks "RANDOM" or "RANDOM STARRED")
     │
     ▼
┌─────────────────────────────────────────┐
│ Query Flashcards:                       │
│                                         │
│ IF studyType == 'random_all':           │
│   SELECT * FROM flashcards              │
│   WHERE set_id = ?                      │
│                                         │
│ IF studyType == 'random_starred':       │
│   SELECT * FROM flashcards              │
│   WHERE set_id = ? AND is_starred = 1   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────┐
│ Shuffle Array (Fisher-Yates)               │
│ flashcards.sort(() => 0.5 - Math.random()) │
└──────────┬─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Display Card (Flashcard Mode)           │
│ - Stats cards still visible (clickable) │
│ - Mode selector: Flashcard/Multi-choice │
│ - Progress bar: 1/50                    │
│ - Flip card to see answer               │
│ - Star button works (toggle)            │
│ - [Prev] [Next] buttons only            │
│ - NO Correct/Incorrect tracking         │
│ - Focus Mode available (F key/LEARN)    │
└──────────┬──────────────────────────────┘
           │
           ▼
     Next Card → ... → Session End
     (No learning_progress updates)
     (Just for review/practice)
```

### 3.4 Filter System

```
┌──────────────────────────────────────────────────────────┐
│           STUDY SESSION FILTER SYSTEM                    │
└──────────────────────────────────────────────────────────┘

Initial Load:
     │
     ▼
┌─────────────────────────────────────────┐
│ Calculate Stats:                        │
│ - total: all flashcards count           │
│ - learned: has learning_progress        │
│ - learning: learned but not mastered    │
│ - new: no learning_progress             │
│ - starred: is_starred = 1               │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Load Saved Filter from localStorage:    │
│ key = `study_filter_{type}_{id}`        │
│ e.g. `study_filter_set_42`              │
│                                         │
│ IF filter exists AND has cards:         │
│   Apply that filter                     │
│ ELSE:                                   │
│   Auto-switch to first available filter │
└──────────┬──────────────────────────────┘
           │
           ▼
User clicks a stat card (e.g. "Learning")
           │
           ▼
┌─────────────────────────────────────────┐
│ filterCards('learning'):                │
│ 1. Filter flashcards array:             │
│    filteredFlashcards = flashcards      │
│      .filter(f => hasProgress &&        │
│               !isMastered)              │
│                                         │
│ 2. Update UI:                           │
│    - Highlight clicked stat card        │
│    - Update "Showing: Learning Cards"   │
│    - Reset to card 1                    │
│    - Update progress bar                │
│                                         │
│ 3. Save to localStorage:                │
│    localStorage.setItem(                │
│      `study_filter_{type}_{id}`,        │
│      'learning'                         │
│    )                                    │
└──────────┬──────────────────────────────┘
           │
           ▼
Display only filtered cards
(All other study features work normally)
```

### 3.5 Focus Mode

```
┌──────────────────────────────────────────────────────────┐
│               FOCUS MODE (Fullscreen Study)              │
└──────────────────────────────────────────────────────────┘

User presses F key or clicks LEARN button
           │
           ▼
┌─────────────────────────────────────────┐
│ Enter Focus Mode:                       │
│ document.body.classList.add(            │
│   'focus-mode-active'                   │
│ )                                       │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ CSS Changes:                            │
│ .hide-in-fullscreen { display: none }   │
│                                         │
│ Hidden elements:                        │
│ - Header (set/folder name)              │
│ - Stats cards row                       │
│ - Mode selector (Flashcard/Multi)       │
│ - Filter info badge                     │
│ - Shortcuts hint                        │
│ - Notes button                          │
│                                         │
│ Visible elements:                       │
│ - Progress bar (compact)                │
│ - Flashcard/Multi-choice                │
│ - Star button (corner)                  │
│ - Answer buttons (Prev/Incorrect/       │
│   Correct/Next or A/B/C/D)              │
│ - Exit button (top-right)               │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Responsive Adjustments:                 │
│                                         │
│ Desktop (sm: breakpoint):               │
│ - Larger flashcard (py-8)               │
│ - Bigger text (text-3xl)                │
│ - More spacing                          │
│                                         │
│ Mobile:                                 │
│ - Compact layout                        │
│ - Smaller text                          │
│ - Touch-friendly buttons (min 44px)     │
└──────────┬──────────────────────────────┘
           │
           ▼
User presses F, ESC, or clicks Exit button
           │
           ▼
┌─────────────────────────────────────────┐
│ Exit Focus Mode:                        │
│ document.body.classList.remove(         │
│   'focus-mode-active'                   │
│ )                                       │
│ All hidden elements reappear            │
└─────────────────────────────────────────┘
```

---

## 4. Spaced Repetition Algorithm

### 4.1 SM-2 Algorithm Implementation

```
┌──────────────────────────────────────────────────────────┐
│            SM-2 ALGORITHM (SuperMemo 2)                  │
│            Modified for Qi Learning App                  │
└──────────────────────────────────────────────────────────┘

Input:
- current_ease_factor (EF) = 2.5 (default)
- current_interval (days)
- current_repetitions (count)
- current_consecutive_correct (count)
- current_is_mastered (boolean)
- is_correct (boolean)

Process:

IF is_correct:
  ┌────────────────────────────────────┐
  │ Increase consecutive_correct += 1  │
  │ Increase repetitions += 1          │
  └──────────┬─────────────────────────┘
             │
             ▼
  IF consecutive_correct >= 4:
    ┌──────────────────────────────────┐
    │ Set is_mastered = 1              │
    │ (PERMANENT - never resets!)      │
    └──────────────────────────────────┘

  Calculate New Interval:
  ┌────────────────────────────────────┐
  │ IF repetitions == 1:               │
  │   new_interval = 1 day             │
  │ ELSE IF repetitions == 2:          │
  │   new_interval = 3 days            │
  │ ELSE IF repetitions == 3:          │
  │   new_interval = 7 days            │
  │ ELSE IF repetitions == 4:          │
  │   new_interval = 15 days           │
  │ ELSE IF repetitions == 5:          │
  │   new_interval = 30 days           │
  │ ELSE IF repetitions == 6:          │
  │   new_interval = 60 days           │
  │ ELSE:                              │
  │   new_interval = round(            │
  │     previous_interval × ease_factor│
  │   )                                │
  └────────────────────────────────────┘

  Adjust Ease Factor:
  ┌────────────────────────────────────┐
  │ new_EF = EF + 0.1                  │
  │ Max: 3.0                           │
  └────────────────────────────────────┘

ELSE (incorrect):
  ┌────────────────────────────────────┐
  │ Reset consecutive_correct = 0      │
  │ Reset repetitions = 0              │
  │ Reset interval_days = 0            │
  │ BUT: KEEP is_mastered unchanged!   │
  │ (Once mastered, stays mastered)    │
  └──────────┬─────────────────────────┘
             │
             ▼
  Adjust Ease Factor:
  ┌────────────────────────────────────┐
  │ new_EF = max(1.3, EF - 0.2)        │
  │ Min: 1.3                           │
  └────────────────────────────────────┘

Final Step:
┌────────────────────────────────────┐
│ UPDATE learning_progress SET       │
│   ease_factor = new_EF,            │
│   interval_days = new_interval,    │
│   next_review_date = NOW()         │
│     + new_interval days,           │
│   last_review_date = NOW(),        │
│   repetitions = new_repetitions,   │
│   consecutive_correct = new_cc,    │
│   is_mastered = new_is_mastered    │
│ WHERE user_id = ? AND flashcard_id │
└────────────────────────────────────┘
```

### 4.2 Interval Progression Example

```
Card Lifecycle (4 correct answers to mastery):

Day 0:  New card created
Day 1:  First review → ✓ Correct → next in 1 day (consecutive: 1)
Day 2:  Second review → ✓ Correct → next in 3 days (consecutive: 2)
Day 5:  Third review → ✓ Correct → next in 7 days (consecutive: 3)
Day 12: Fourth review → ✓ Correct → next in 15 days (consecutive: 4) → MASTERED!
Day 27: Fifth review (mastered) → ✓ Correct → next in 30 days
Day 57: Sixth review (mastered) → ✓ Correct → next in 60 days
Day 117: Seventh review (mastered) → ✓ Correct → next in 60 × ease_factor days

If incorrect on Day 27 (AFTER mastered):
Day 27: Fifth review → ✗ Incorrect
        - Reset consecutive_correct = 0
        - Reset repetitions = 0
        - Reset interval = 0 → next in 0 days (immediate review)
        - Ease factor -= 0.2
        - BUT: is_mastered STAYS 1 (permanent!)
        - Card still shows as "Mastered" but needs immediate review

Day 27: Immediate re-review → ✓ Correct → next in 1 day (restart intervals)
Day 28: Second review → ✓ Correct → next in 3 days
...
(but still marked as Mastered throughout)
```

**Key Insight**: Once a card reaches "Mastered" status (4 consecutive correct), it NEVER loses that status. This is intentional to:

- Recognize that the user has proven they know the material
- Maintain motivation (mastered cards don't become "unmastered")
- Still require review when incorrect (reset intervals to 0)
- Separate "mastery achievement" from "current review status"

```

---

## 5. Sharing System

### 5.1 Share Creation Flow

```
┌──────────────────────────────────────────────────────────┐
│                 SHARE CREATION FLOW                      │
└──────────────────────────────────────────────────────────┘

Owner views their Set/Folder
         │
         ▼
┌─────────────────────────────────────────┐
│ Set: "Spanish Vocabulary"               │
│                                         │
│ [Share] button                          │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Share Set Form                          │
│                                         │
│ Share with: [Select User] ▼             │
│                                         │
│ ☑ Allow recipient to export content     │
│                                         │
│ [Share]                                 │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ CREATE share record:                    │
│ INSERT INTO set_shares (                │
│   set_id,                               │
│   shared_by_user_id,                    │
│   shared_with_user_id,                  │
│   share_token = random_uuid,            │
│   allow_export = 1/0,                   │
│   is_accepted = 0                       │
│ )                                       │
└──────────┬──────────────────────────────┘
           │
           ▼
     Share Created (pending)
```

### 5.2 Share Acceptance Flow (Clone Creation)

```
┌──────────────────────────────────────────────────────────┐
│              SHARE ACCEPTANCE FLOW                       │
└──────────────────────────────────────────────────────────┘

Recipient clicks share link or accepts from "My Shares"
         │
         ▼
┌─────────────────────────────────────────┐
│ GET /shares/sets/:token/view            │
│                                         │
│ 1. Lookup share:                        │
│    SELECT * FROM set_shares             │
│    WHERE share_token = ?                │
│    AND shared_with_user_id = current    │
│                                         │
│ 2. Check is_accepted:                   │
│    IF is_accepted = 0: → CLONE          │
│    IF is_accepted = 1: → Already done   │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ CLONE PROCESS:                          │
│                                         │
│ 1. CREATE new Set:                      │
│    INSERT INTO sets (                   │
│      user_id = recipient_id,            │
│      name = original_name + " (from     │
│              owner_username)",          │
│      description = original_desc,       │
│      folder_id = NULL,                  │
│      source_set_id = original_set_id,   │
│      allow_export = share.allow_export  │
│    )                                    │
│    → cloned_set_id                      │
│                                         │
│ 2. CLONE all flashcards:                │
│    FOR EACH flashcard in original set:  │
│      INSERT INTO flashcards (           │
│        set_id = cloned_set_id,          │
│        word = f.word,                   │
│        definition = f.definition,       │
│        is_starred = 0  ← reset starred  │
│      )                                  │
│                                         │
│ 3. UPDATE share record:                 │
│    UPDATE set_shares SET                │
│      is_accepted = 1,                   │
│      accepted_at = NOW()                │
│    WHERE id = share_id                  │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Redirect to cloned set view             │
│                                         │
│ Recipient now has:                      │
│ - Complete copy of set (source_set_id   │
│   points to original)                   │
│ - Own learning progress (empty)         │
│ - Can study independently               │
│ - Can star cards (own starred status)   │
│ - Can add personal notes                │
│                                         │
│ RESTRICTIONS for cloned sets:           │
│ ✗ Cannot edit flashcards                │
│ ✗ Cannot add new flashcards             │
│ ✗ Cannot import flashcards              │
│ ✗ Cannot delete individual cards        │
│ ✓ Can delete entire set                 │
│ ✓ Must use "Update from Source" button  │
│ ✓ Can export (if allow_export = 1)      │
└─────────────────────────────────────────┘
```

### 5.3 Update from Source

```
┌──────────────────────────────────────────────────────────┐
│            UPDATE FROM SOURCE FLOW                       │
└──────────────────────────────────────────────────────────┘

Owner updates original set (adds/edits/deletes cards)
         │
         ▼
Recipient visits cloned set, clicks "Update from Source"
         │
         ▼
┌─────────────────────────────────────────┐
│ POST /shares/sets/:id/update-from-source│
│                                         │
│ 1. Verify ownership & source:           │
│    - set.user_id == current_user        │
│    - set.source_set_id != NULL          │
│    - source set still exists            │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ UPDATE PROCESS:                         │
│                                         │
│ 1. DELETE all flashcards in clone:      │
│    DELETE FROM flashcards               │
│    WHERE set_id = cloned_set_id         │
│    (Learning progress preserved!)       │
│                                         │
│ 2. CLONE latest flashcards:             │
│    FOR EACH flashcard in source:        │
│      INSERT INTO flashcards (           │
│        set_id = cloned_set_id,          │
│        word = source.word,              │
│        definition = source.definition,  │
│        is_starred = 0                   │
│      )                                  │
│                                         │
│ 3. UPDATE set metadata:                 │
│    UPDATE sets SET                      │
│      name = source.name + " (from...)", │
│      description = source.description,  │
│      updated_at = NOW()                 │
│    WHERE id = cloned_set_id             │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ Result:                                 │
│ ✓ Cloned set now has latest content    │
│ ✓ Learning progress preserved           │
│   (matched by user_id + flashcard_id)   │
│ ✓ New flashcards appear as "New"        │
│ ✓ Deleted flashcards: progress lost     │
│ ✓ Modified flashcards: new IDs → lost   │
│   progress (limitation)                 │
└─────────────────────────────────────────┘
```

### 5.4 Share States & Reshare

```
┌──────────────────────────────────────────────────────────┐
│              SHARE STATES DIAGRAM                        │
└──────────────────────────────────────────────────────────┘

STATE 1: PENDING
┌─────────────────────────────────────────┐
│ set_shares:                             │
│   is_accepted = 0                       │
│   accepted_at = NULL                    │
│                                         │
│ Cloned set: DOES NOT EXIST              │
│                                         │
│ Recipient sees: "Pending" in My Shares  │
│ Can click link to accept                │
└──────────┬──────────────────────────────┘
           │ (clicks Accept/Access)
           ▼

STATE 2: ACCEPTED (Clone Exists)
┌─────────────────────────────────────────┐
│ set_shares:                             │
│   is_accepted = 1                       │
│   accepted_at = 2025-10-23 10:00        │
│                                         │
│ Cloned set: EXISTS                      │
│   source_set_id = original_id           │
│                                         │
│ Recipient sees: "Accepted" in My Shares │
│ Can access cloned set                   │
│ Can study, add notes, update from source│
└──────────┬──────────────────────────────┘
           │ (recipient deletes clone)
           ▼

STATE 3: ACCEPTED but Clone Deleted
┌─────────────────────────────────────────┐
│ set_shares:                             │
│   is_accepted = 1                       │
│   accepted_at = 2025-10-23 10:00        │
│                                         │
│ Cloned set: DOES NOT EXIST              │
│ (recipient deleted it)                  │
│                                         │
│ Owner sees: "Accepted but deleted"      │
│ Owner can "Reshare" → reset to pending  │
└──────────┬──────────────────────────────┘
           │ (owner clicks Reshare)
           ▼

RESHARE PROCESS:
┌─────────────────────────────────────────┐
│ POST /reshare/set/:shareId              │
│                                         │
│ UPDATE set_shares SET                   │
│   is_accepted = 0,                      │
│   accepted_at = NULL,                   │
│   created_at = NOW()                    │
│ WHERE id = share_id                     │
└──────────┬──────────────────────────────┘
           │
           ▼
Back to STATE 1: PENDING
(Recipient can accept again)
```

---

## 6. Import/Export System

### 6.1 Import Parser Logic

```
┌──────────────────────────────────────────────────────────┐
│               IMPORT PARSER FLOW                         │
└──────────────────────────────────────────────────────────┘

Input Text:
┌────────────────────────────────────────┐
│ hello<TAB>greeting||personal note      │
│ world<TAB>planet                       │
│ sky<TAB>above us||look up!             │
└────────────────────────────────────────┘

Configuration:
- term_def_separator = "\t" (TAB)
- note_separator = "||"
- flashcard_separator = "\n" (newline)

Parsing Steps:

1. Split by flashcard_separator:
   lines = text.split('\n')
   → ["hello<TAB>greeting||note", "world<TAB>planet", ...]

2. For each line:
   parts = line.split(note_separator)
   → term_def = "hello<TAB>greeting"
   → note = "personal note" (if exists)

3. Split term_def:
   [term, definition] = term_def.split(term_def_separator)
   → term = "hello"
   → definition = "greeting"

4. Create flashcard object:
   {
     word: "hello",
     definition: "greeting",
     note: "personal note"
   }

5. Validation:
   - term must not be empty
   - definition must not be empty
   - note is optional

6. Preview display:
   ┌────────────────────────────────────────┐
   │ Preview (3 flashcards):                │
   │                                        │
   │ ✓ hello → greeting                     │
   │   Note: personal note                  │
   │                                        │
   │ ✓ world → planet                       │
   │                                        │
   │ ✓ sky → above us                       │
   │   Note: look up!                       │
   │                                        │
   │ [Confirm Import]                       │
   └────────────────────────────────────────┘

7. Bulk insert (transaction):
   db.transaction(() => {
     for (card of flashcards) {
       INSERT INTO flashcards (...)
       if (card.note) {
         INSERT INTO user_notes (...)
       }
     }
   })
```

### 6.2 Export Format

```
┌──────────────────────────────────────────────────────────┐
│                 EXPORT FORMAT                            │
└──────────────────────────────────────────────────────────┘

Query:
SELECT
  f.word,
  f.definition,
  un.note
FROM flashcards f
LEFT JOIN user_notes un ON (
  f.id = un.flashcard_id AND
  un.user_id = ?
)
WHERE f.set_id = ?

Output (Plain Text):
┌────────────────────────────────────────┐
│ hello<TAB>greeting||personal note      │
│ world<TAB>planet                       │
│ sky<TAB>above us||look up!             │
└────────────────────────────────────────┘

Downloaded as: setname-flashcards.txt
Content-Type: text/plain
Content-Disposition: attachment
```

---

## 7. UI/UX Design

### 7.1 Study Card Flip Animation

```
┌──────────────────────────────────────────────────────────┐
│           FLASHCARD FLIP ANIMATION (CSS)                 │
└──────────────────────────────────────────────────────────┘

Initial State (TERM side):
┌─────────────────────────────────────┐
│                                     │
│            TERM                     │
│                                     │
│            hello                    │
│                                     │
│       [Click to flip]               │
│                                     │
└─────────────────────────────────────┘

CSS Structure:
.flashcard-container {
  perspective: 1000px;
}

.flashcard {
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  backface-visibility: hidden;
  position: absolute;
}

.flashcard-back {
  transform: rotateY(180deg);
}

Animation Sequence:
    0°                90°               180°
┌──────┐         ┌────────┐         ┌──────┐
│TERM  │   →     │        │   →     │  DEF │
│hello │         │        │         │greet │
└──────┘         └────────┘         └──────┘
 (front)       (edge view)          (back)

JavaScript:
card.addEventListener('click', () => {
  card.classList.toggle('flipped');
});
```

### 7.2 Statistics Cards (Filters)

```
┌──────────────────────────────────────────────────────────┐
│              STATISTICS FILTERS UI                       │
└──────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Set: Spanish Vocabulary                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │Total │  │Learn │  │Learn │  │ New  │  │Stars │      │
│  │      │  │ ed   │  │ ing  │  │      │  │      │      │
│  │  50  │  │  20  │  │  25  │  │  5   │  │  12  │      │
│  │ [✓]  │  │      │  │      │  │      │  │      │      │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                        │
│ Showing: 50 flashcards (All)                           │
└────────────────────────────────────────────────────────┘

Click on "Learned":
┌────────────────────────────────────────────────────────┐
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │Total │  │Learn │  │Learn │  │ New  │  │Stars │      │
│  │      │  │ ed   │  │ ing  │  │      │  │      │      │
│  │  50  │  │  20  │  │  25  │  │  5   │  │  12  │      │
│  │      │  │ [✓]  │  │      │  │      │  │      │      │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                        │
│ Showing: 20 flashcards (Learned)                       │
└────────────────────────────────────────────────────────┘

Filter Logic:
filteredFlashcards = flashcards.filter(card => {
  switch(activeFilter) {
    case 'total': return true;
    case 'learned': return card.has_progress;  // Has learning_progress record
    case 'learning': return card.has_progress && !card.is_mastered;
    case 'new': return !card.has_progress;  // No learning_progress record
    case 'starred': return card.is_starred;
  }
});

Update display:
currentCard = filteredFlashcards[currentIndex];
```

### 7.3 Focus Mode (Fullscreen Study)

```
┌──────────────────────────────────────────────────────────┐
│              FOCUS MODE (LEARN Button)                   │
└──────────────────────────────────────────────────────────┘

Normal Mode:
┌────────────────────────────────────────────────────────┐
│ [Navbar] [Stats] [Filters] [Mode Selector]             │
├────────────────────────────────────────────────────────┤
│                                                        │
│    ┌──────────────────────────────────┐                │
│    │        Flashcard                 │                │
│    │          hello                   │                │
│    └──────────────────────────────────┘                │
│                                                        │
│    [Know] [Don't Know]                                 │
│                                                        │
│ [Shortcuts] [Notes] [Footer]                           │
└────────────────────────────────────────────────────────┘

Focus Mode (Press F or click LEARN):
┌────────────────────────────────────────────────────────┐
│    ████████████░░░░░░░░ 12/15           [Exit ✕]       │
│                                                        │
│    ┌──────────────────────────────────┐                │
│    │                                  │                │
│    │         Flashcard                │                │
│    │                                  │                │
│    │           hello                  │                │
│    │                                  │                │
│    │      [Click to flip]             │                │
│    │                                  │                │
│    └──────────────────────────────────┘                │
│                        ☆                               │
│                                                        │
│         [Know ✓]    [Don't Know ✗]                     │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘

CSS:
body.focus-mode-active .hide-in-fullscreen {
  display: none !important;
}

Hidden elements:
- Header/navbar
- Stats cards
- Mode selector
- Filter info
- Shortcuts guide
- Notes button
- Footer

Visible elements:
- Progress bar (compact)
- Flashcard
- Star button
- Answer buttons
- Exit button (top-right)

Exit triggers:
- Click exit button
- Press F key
- Press ESC key
```

---

## 8. Database Design

See [database/MIGRATION.md](../src/database/MIGRATION.md) for complete schema.

### 8.1 Key Relationships Diagram

```
┌─────────┐
│  users  │
└────┬────┘
     │
     ├──────────────────┬──────────────┬──────────────┐
     │                  │              │              │
     ▼                  ▼              ▼              ▼
┌─────────┐      ┌──────────┐   ┌──────────┐   ┌──────────┐
│ folders │◄────►│   sets   │   │  notes   │   │ progress │
└─────────┘      └────┬─────┘   └──────────┘   └──────────┘
     │                │
     │                ▼
     │         ┌────────────┐
     │         │ flashcards │
     │         └────────────┘
     │                │
     └────────────────┴──────────┐
                                  ▼
                          ┌──────────────┐
                          │ folder_sets  │
                          │ (junction)   │
                          └──────────────┘
```

---

## 9. API Endpoints

See [routes/README.md](../src/routes/README.md) for complete endpoint documentation.

### 9.1 RESTful Conventions

```
Resource: Sets

GET    /sets           → List all sets
GET    /sets/create    → Create form
POST   /sets/create    → Create submission
GET    /sets/:id       → View set
GET    /sets/:id/edit  → Edit form
POST   /sets/:id/edit  → Update submission
POST   /sets/:id/delete→ Delete

Study endpoints:
GET    /study/set/:id         → Long-term study
GET    /study/set/:id/random  → Random study
POST   /study/answer          → Submit answer
```

---

## 10. Security Implementation

### 10.1 SQL Injection Prevention

```javascript
// ✓ CORRECT - Prepared Statement
const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
const user = stmt.get(username);

// ✗ WRONG - String Concatenation
const query = `SELECT * FROM users WHERE username = '${username}'`;
// Vulnerable to: ' OR '1'='1
```

### 10.2 Authorization Checks

```javascript
// Check resource ownership
const set = Set.findById(setId);
if (set.user_id !== req.user.id) {
  req.flash('error', 'Access denied');
  return res.redirect('/sets');
}

// Admin-only check
if (!req.user.is_admin) {
  req.flash('error', 'Admin access required');
  return res.redirect('/dashboard');
}
```

### 10.3 Session Security

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,  // From .env
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // Prevent XSS
    secure: false,       // Set true if HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
}));
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-23
