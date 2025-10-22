# Study Mode Feature - Flashcard vs Multi-Choice

## 🎯 Overview

Hệ thống study có 2 modes:
1. **Flashcard Mode** - Traditional flip cards (default)
2. **Multi-Choice Mode** - Interactive quiz với đáp án A, B, C, D

## 📋 How It Works

### Mode Selector

Ở đầu study session có 2 nút:
```
[🗂️ Flashcard] [☑️ Multi-Choice]
```

- **Flashcard Mode**: Hiển thị tất cả cards dưới dạng flip cards
- **Multi-Choice Mode**: 
  - ✅ Nếu card thỏa format → hiển thị quiz với đáp án A, B, C, D
  - ❌ Nếu card KHÔNG thỏa format → vẫn hiển thị flip card bình thường

### Multi-Choice Format Detection

Card được coi là multi-choice nếu:
1. **DEFINITION** bắt đầu bằng `Correct: A` hoặc `Correct: A, C`
2. **TERM** có options với format `A. ` `B. ` `C. ` `D. `

**Example:**
```
TERM: 
What is AWS?
A. Database
B. Operating System  
C. Cloud Platform
D. Programming Language

DEFINITION:
Correct: C
```

### Behavior by Mode

#### Flashcard Mode (All Cards)
- Hiển thị question ở mặt trước
- Hiển thị answer ở mặt sau
- Click để flip
- Buttons: **Incorrect** / **Correct** (long-term) hoặc **Next** (random)

#### Multi-Choice Mode

**Nếu card thỏa format:**
- ❌ **KHÔNG** hiển thị nút Incorrect/Correct
- ✅ Hiển thị đáp án A, B, C, D với radio buttons
- Click chọn đáp án → nút "Check Answer" sáng lên
- Click "Check Answer" → highlight correct (green) và wrong (red)
- Auto chuyển card sau 2 giây

**Nếu card KHÔNG thỏa format:**
- ✅ Hiển thị như Flashcard mode bình thường
- ✅ Có nút Incorrect/Correct như thường

## 🎨 UI Elements

### Multi-Choice Question Display

```
┌─────────────────────────────────────────────┐
│ What is AWS?                                │
│                                             │
│ ○ A. Database                               │
│ ◉ B. Operating System    [selected]         │
│ ○ C. Cloud Platform                         │
│ ○ D. Programming Language                   │
│                                             │
│ [Check Answer]                              │
└─────────────────────────────────────────────┘
```

### After Checking Answer

**Correct Answer:**
```
┌─────────────────────────────────────────────┐
│ What is AWS?                                │
│                                             │
│ ○ A. Database                               │
│ ○ B. Operating System                       │
│ ◉ C. Cloud Platform              ✓          │ ← Green
│ ○ D. Programming Language                   │
│                                             │
│ [✓ Correct!]                                │ ← Green button
└─────────────────────────────────────────────┘
```

**Wrong Answer:**
```
┌─────────────────────────────────────────────┐
│ What is AWS?                                │
│                                             │
│ ○ A. Database                               │
│ ◉ B. Operating System            ✗          │ ← Red (your choice)
│ ◉ C. Cloud Platform              ✓          │ ← Green (correct)
│ ○ D. Programming Language                   │
│                                             │
│ [✗ Incorrect]                               │ ← Red button
└─────────────────────────────────────────────┘
```

## 🔄 Answer Button Logic

### Long-term Learning (Spaced Repetition)

| Card Type | Condition | Buttons Shown |
|-----------|-----------|---------------|
| Multi-choice | Format OK | A, B, C, D + Check Answer |
| Multi-choice | Format NO | Incorrect / Correct |
| Regular | Any | Incorrect / Correct |

### Random Study

| Card Type | Condition | Buttons Shown |
|-----------|-----------|---------------|
| Multi-choice | Format OK | A, B, C, D + Check Answer |
| Multi-choice | Format NO | Next Card |
| Regular | Any | Next Card |

## 💡 Key Features

1. **Smart Detection**: Tự động detect format, không cần manual tagging
2. **Graceful Fallback**: Card không đúng format vẫn hoạt động bình thường
3. **Visual Feedback**: Green/red colors, icons cho correct/incorrect
4. **Auto-advance**: Tự động chuyển card sau khi check answer
5. **Disabled State**: Không cho đổi answer sau khi check
6. **Mode Hint**: Hiển thị số lượng cards hỗ trợ multi-choice

## 📝 Example Study Session

### Scenario: 10 flashcards, 7 multi-choice + 3 regular

**Flashcard Mode:**
- All 10 cards → flip card interface
- All 10 cards → Incorrect/Correct buttons

**Multi-Choice Mode:**
- 7 cards → quiz interface (A, B, C, D options)
- 3 cards → flip card interface (fallback)
- Mode hint: "7 cards support multi-choice mode"

## 🚀 Usage Tips

1. **Import từ Markdown**: Tự động format đúng cho multi-choice mode
2. **Mix content**: Có thể mix multi-choice và regular flashcards trong 1 set
3. **Study preference**: Chọn mode phù hợp với learning style
4. **Switch anytime**: Có thể đổi mode giữa session
5. **Note support**: Notes vẫn hoạt động với cả 2 modes

## 🔧 Technical Details

### Format Detection Function
```javascript
function isMultiChoiceCard(card) {
  return card.definition.match(/^Correct:\s*[A-Z]/i) && 
         card.term.match(/[A-Z]\.\s+/);
}
```

### Answer Button Control
```javascript
const isMultiChoice = studyMode === 'multichoice' && isMultiChoiceCard(card);

if (isMultiChoice) {
  answerButtonsSection.style.display = 'none'; // Hide normal buttons
  renderMultiChoiceCard(card); // Show A,B,C,D options
} else {
  answerButtonsSection.style.display = 'block'; // Show normal buttons
  // Regular flashcard display
}
```

### Note Handling
```javascript
// Strip YYY note separator when rendering multi-choice
let termContent = card.term;
if (termContent.includes('YYY')) {
  termContent = termContent.split('YYY')[0]; // Only show question+options
}
// Note still accessible via "View Note" button
```

## 📚 Related Features

- **Markdown Import**: Tạo multi-choice flashcards từ markdown (xem `MARKDOWN_IMPORT_FEATURE.md`)
- **XXX/YYY/ZZZ Import**: Alternative import method (xem `IMPORT_FEATURE.md`)
- **Spaced Repetition**: Works với cả flashcard và multi-choice modes
- **Starred Cards**: Filter hoạt động với cả 2 modes
