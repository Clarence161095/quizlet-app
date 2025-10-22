# Markdown Import Feature

## 📋 Overview

Tính năng import flashcards từ định dạng Markdown với checkbox notation. Đặc biệt phù hợp cho câu hỏi trắc nghiệm từ exam dumps, AWS certification questions, etc.

## 🎯 Format

### Basic Structure

```markdown
### Question text here?

- [ ] Wrong option
- [x] Correct option
- [ ] Wrong option
- [x] Another correct option

Optional note text here. Any text after the options will be treated as a note.

### Next question?

- [ ] Option A
- [x] Correct answer
...
```

### Key Points

- **Question**: Lines starting with `###` (GitHub heading level 3)
- **Wrong options**: `- [ ]` (empty checkbox)
- **Correct options**: `- [x]` (checked checkbox)
- **Note**: Any text after options = note (optional)
- **Multiple correct**: Support multi-select questions (Choose TWO, etc.)

## 💾 How Data is Stored

After import, flashcards are stored as:

### TERM Field
```
Question text?
A. Option 1
B. Option 2
C. Option 3
D. Option 4YYYOptional note text
```

**Structure:**
- Question text (first line)
- Options with letters (A, B, C, D...)
- `YYY` separator before note (if note exists)
- Note text (optional)

### DEFINITION Field
```
Correct: C
```

or for multiple answers:

```
Correct: A, C
```

**Format:** `Correct: ` prefix + letter(s) separated by commas

## 🖥️ How to Use

### 1. In Set View Page

1. Click purple **"Import MD"** button
2. Paste your markdown content
3. Click **"Preview"** to verify parsing
4. Click **"Import"** to create flashcards

### 2. Study Modes

#### Flashcard Mode (Default)
- Traditional flip-card interface
- Shows question + options on front
- Shows correct answer on back
- Works for ALL flashcards

#### Multi-Choice Mode
- Interactive quiz interface
- Radio buttons for each option
- Click to select answer
- Click "Check Answer" to verify
- Correct answers highlighted in green
- Wrong selection highlighted in red
- Auto-advances after 1.5 seconds

**Mode Selector:** Two buttons at top of study session
- 🗂️ **Flashcard** - Traditional mode
- ☑️ **Multi-Choice** - Quiz mode (only works for imported multi-choice questions)

### 3. Smart Detection

The app automatically detects if a flashcard supports multi-choice mode by checking:
- ✅ Definition starts with `Correct: `
- ✅ Term contains options (A. B. C. D.)

If multi-choice mode is selected but the current flashcard doesn't support it, it will display as a regular flashcard.

## 📊 Example Import

### Input (Markdown)
```markdown
### What is AWS?

- [ ] Database
- [ ] Operating System
- [x] Cloud Platform
- [ ] Programming Language

AWS stands for Amazon Web Services and is a cloud computing platform.

### Which AWS service stores objects?

- [ ] EC2
- [x] S3
- [ ] Lambda
- [ ] RDS

S3 (Simple Storage Service) is designed for object storage with 99.999999999% durability.
```

### Result (2 Flashcards)

**Flashcard 1:**
- **TERM**: `What is AWS?\nA. Database\nB. Operating System\nC. Cloud Platform\nD. Programming LanguageYYYAWS stands for Amazon Web Services and is a cloud computing platform.`
- **DEFINITION**: `Correct: C`

**Flashcard 2:**
- **TERM**: `Which AWS service stores objects?\nA. EC2\nB. S3\nC. Lambda\nD. RDSYYYSS (Simple Storage Service) is designed for object storage with 99.999999999% durability.`
- **DEFINITION**: `Correct: B`

## 🎨 UI Features

### Import Form
- Purple theme (border-left-4 border-purple-500)
- Collapsible (shows/hides with button toggle)
- Example format displayed
- 15-row textarea for content
- Preview button with flashcard count
- Cancel button to close form

### Preview Display
- Purple badges for each question
- Shows question text
- Lists all options
- Highlights correct answer(s) in bold
- Shows note if exists
- Displays total flashcard count

### Study Mode Selector
- Blue active button
- Gray inactive button
- Info hint shows multi-choice card count
- Persists across cards (doesn't reset)

### Multi-Choice Interface
- Hover effect on options (blue highlight)
- Selected option: blue border + background
- Correct answer: green border + checkmark icon
- Wrong answer: red border + X icon
- "Check Answer" button (disabled until selection)
- Result feedback (✓ Correct! or ✗ Incorrect)

## 🔧 Technical Implementation

### Parser Logic (Client + Server)

```javascript
function parseMarkdownQuestions(text) {
  // 1. Split by ### to get question blocks
  // 2. First line = question
  // 3. Lines with - [x] = correct options
  // 4. Lines with - [ ] = wrong options
  // 5. Assign letters (A, B, C, D...)
  // 6. Text after options = note
  // 7. Build TERM: question + options + YYY + note
  // 8. Build DEFINITION: Correct: A or Correct: A, C
}
```

### Routes
- **POST** `/sets/:id/import-markdown` - Import handler
  - Validates set ownership
  - Parses markdown content
  - Creates flashcards via `Flashcard.create()`
  - Flash success message
  - Redirects to set view

### Study Session Logic
```javascript
// Detect multi-choice card
function isMultiChoiceCard(card) {
  return card.definition.match(/^Correct:\s*[A-Z]/i) && 
         card.term.match(/[A-Z]\.\s+/);
}

// Render based on mode
if (studyMode === 'multichoice' && isMultiChoiceCard(card)) {
  renderMultiChoiceCard(card); // Interactive quiz UI
} else {
  // Regular flashcard with flip animation
}
```

## 📝 Comparison: XXX/YYY/ZZZ vs Markdown

| Feature | XXX/YYY/ZZZ | Markdown |
|---------|-------------|----------|
| **Separator** | Custom (XXX, YYY, ZZZ) | Standard (###, checkboxes) |
| **Use Case** | Custom formatted data | Exam questions, docs |
| **Multi-Choice** | Prefix with `XXX` | Automatic detection |
| **Note** | `YYY` separator | Text after options |
| **Correct Answer** | `XXX` prefix on option | `- [x]` checkbox |
| **Source** | Custom exports | GitHub, exam dumps |
| **Learning Curve** | Need to learn format | Familiar markdown |

**When to use XXX/YYY/ZZZ:**
- Importing from custom exports
- Converting from spreadsheets
- Specific separator requirements

**When to use Markdown:**
- Copying from documentation
- AWS/Azure/GCP exam questions
- GitHub issues/wikis
- Standard markdown files

## 🚀 Tips

1. **Copy from GitHub**: Markdown format works great for GitHub wiki pages with question lists
2. **Exam Dumps**: Most certification exam dumps use this checkbox format
3. **Notes**: Add explanations after options for learning context
4. **Preview First**: Always preview before importing to verify parsing
5. **Multi-Select**: Use multiple `[x]` for "Choose TWO" type questions
6. **Edit After**: You can still edit imported flashcards individually if needed

## 🐛 Troubleshooting

### Preview shows 0 flashcards
- ✅ Check `###` heading format (3 hashes, space after)
- ✅ Verify checkbox format: `- [ ]` or `- [x]` (space in brackets)
- ✅ At least 2 options + 1 correct answer required

### Options not displaying correctly
- ✅ Each option must be on separate line
- ✅ Use `-` (dash) not `*` (asterisk)
- ✅ Space after checkbox: `- [x] Text` not `- [x]Text`

### Note not showing
- ✅ Note must be after all options
- ✅ No blank lines between options and note
- ✅ Note appears in "View Note" button during study

### Multi-choice mode not working
- ✅ Check definition format: `Correct: A` (with colon and space)
- ✅ Check term has options: `A. ` (letter, dot, space)
- ✅ Mode selector shows count of compatible cards

## 📚 Examples

See `sample-markdown-import.md` for working examples with 10 AWS questions.
