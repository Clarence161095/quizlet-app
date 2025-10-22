# Import Feature Documentation

## Overview
The import feature has been upgraded to support **multi-choice questions** and provides an **always-visible import form** directly on the set view page.

## New Features

### 1. Always-Visible Import Form
- Import button now shows a collapsible form directly on the set view page
- No need to navigate to a separate page
- Located next to Export button for easy access

### 2. New Default Separators
- **XXX**: Term/Definition separator (replaces old `|`)
- **YYY**: Note separator (replaces old `|`)
- **ZZZ**: Flashcard separator (replaces old `===`)

### 3. Multi-Choice Question Support
The parser automatically detects multi-choice format:

```
Question text here
A. Option A
B. Option B
XXXC. Correct Option  <- Mark correct answer with XXX prefix
D. Option D
```

**Result:**
- **Term**: Question text
- **Definition**: All options formatted with line breaks + "✓ Correct: C" indicator
- Multi-choice badge shown in preview

### 4. Multi-Line Term Support
- Term field now uses `<textarea>` instead of `<input>`
- Supports multi-line questions/terms
- Create and Edit flashcard forms updated
- Study session properly displays multi-line text with `white-space: pre-wrap`

## Import Format Examples

### Simple Format
```
HelloXXXXin chàoYYYGreeting phraseZZZThank youXXXCảm ơnYYYPolite expression
```

### Multi-Choice Format
```
What is AWS Lambda?
A. Database service
B. Storage service
XXXC. Serverless compute service
D. Networking serviceYYYAWS Lambda basicsZZZWhat is DynamoDB?
A. Relational database
XXXB. NoSQL database
C. Cache service
D. Queue service
```

### Mixed Format
You can mix simple and multi-choice in the same import:

```
Simple term hereXXXSimple definition hereZZZWhat is EC2?
A. Storage
XXXB. Compute
C. DatabaseYYYEC2 basics
```

## Usage Instructions

### On Set View Page
1. Click **Import** button (green, next to Export)
2. Import form slides down with:
   - Separator configuration (pre-filled with XXX/YYY/ZZZ)
   - Textarea for flashcard data
   - Preview button
3. Paste your data
4. Click **Preview** to verify parsing
5. Click **Import** to create flashcards

### Import Workflow
```
Set View → Import Button → Paste Data → Preview → Verify → Import → Flashcards Created
```

## Parser Behavior

### Multi-Choice Detection
The parser checks each flashcard block for:
1. First line = question
2. Following lines match pattern: `[A-Z]. Text`
3. One option has `XXX` prefix (correct answer)
4. Minimum 2 options required

If all conditions met → Multi-choice format
Otherwise → Regular term/definition format

### Note Handling
- Notes are optional
- Use YYY separator to add notes
- Notes stored in `user_notes` table (per-user private notes)

## Technical Details

### Files Modified
1. **src/views/sets/view.ejs**
   - Added collapsible import form
   - Added preview with multi-choice indicator
   - JavaScript parser with multi-choice detection
   - `whitespace: pre-wrap` CSS for multi-line display

2. **src/routes/sets.js**
   - Added `parseMultiChoice()` helper function
   - Updated POST /import to try multi-choice parsing first
   - Falls back to regular separator parsing

3. **src/views/flashcards/create.ejs**
   - Term field changed from `<input>` to `<textarea>` (4 rows)
   - Label updated to "Term (Question)"

4. **src/views/flashcards/edit.ejs**
   - Term field changed from `<input>` to `<textarea>` (4 rows)
   - Label updated to "Term (Question)"

5. **src/views/study/session.ejs**
   - Added CSS: `white-space: pre-wrap` for multi-line support
   - Existing `formatContent()` already handles multi-choice display

### Database
No schema changes required - uses existing:
- `flashcards.word` → Stores term/question (TEXT supports multi-line)
- `flashcards.definition` → Stores definition/options
- `user_notes.note` → Stores user notes

## Sample Import File

See `/sample-import-test.txt` for a working example with:
- 3 multi-choice questions
- Notes on each
- XXX/YYY/ZZZ separators

## AWS Course Import

To import AWS DVA-C02 exam questions from `course-sample/DV2/README.md`:

1. Extract questions from markdown (format already compatible!)
2. Mark correct answers with XXX prefix
3. Separate questions with ZZZ
4. Add notes with YYY (optional)
5. Import via the form

### Example Transformation

**From README.md:**
```markdown
### Question title here

- [ ] Wrong answer A
- [ ] Wrong answer B
- [x] Correct answer C
- [ ] Wrong answer D
```

**To Import Format:**
```
Question title here
A. Wrong answer A
B. Wrong answer B
XXXC. Correct answer C
D. Wrong answer DYYYNOTE_IF_NEEDEDZZZ
```

## Best Practices

1. **Always preview** before importing to verify parsing
2. **Use consistent separators** throughout your import file
3. **Mark correct answers** clearly with XXX prefix for multi-choice
4. **Keep notes concise** - they display in study session note section
5. **Multi-line questions** work great for code snippets or complex scenarios

## Troubleshooting

### No flashcards found in preview
- Check separator configuration matches your data
- Ensure XXX appears exactly once per multi-choice question
- Verify at least 2 options exist for multi-choice

### Wrong options marked as correct
- XXX must be prefix of the correct option line
- Format: `XXXC. Correct text here`
- No spaces before XXX

### Notes not showing
- Ensure YYY separator is in the right position
- Format: `TermXXXDefinitionYYYNote text here`
- Notes only show in study session (not on set view list)

## Future Enhancements (Planned)
- Image support for terms/definitions
- Bulk import from CSV/Excel
- Import history tracking
- Export with same XXX/YYY/ZZZ format
