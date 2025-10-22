# Quizlet-Style Multi-Choice Update

## 🎨 Overview

Đã refactor giao diện Multi-Choice để giống với Quizlet.com, tập trung vào:
- **Numbered circles** thay vì radio buttons
- **Hover effects** mượt mà với shadow và transform
- **Clean layout** với spacing và typography tốt hơn
- **Visual feedback** rõ ràng khi chọn đúng/sai

## 📊 So sánh Before/After

### Before (Old Design)
```
┌─────────────────────────────────────────┐
│ Question text here?                     │
│                                         │
│ [ ] A. Option A text                    │
│ [ ] B. Option B text                    │
│ [ ] C. Option C text                    │
│ [ ] D. Option D text                    │
│                                         │
│ [Check Answer]                          │
└─────────────────────────────────────────┘
```

### After (Quizlet-Style)
```
┌─────────────────────────────────────────┐
│ TERM                                    │
│                                         │
│ Question text here?                     │
│                                         │
│ Choose an answer                        │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ (1)  Option A text              │    │
│ └─────────────────────────────────┘    │
│ ┌─────────────────────────────────┐    │
│ │ (2)  Option B text              │    │
│ └─────────────────────────────────┘    │
│ ┌─────────────────────────────────┐    │
│ │ (3)  Option C text              │    │
│ └─────────────────────────────────┘    │
│ ┌─────────────────────────────────┐    │
│ │ (4)  Option D text              │    │
│ └─────────────────────────────────┘    │
│                                         │
│ [Check Answer]                          │
│ [Don't know?]                           │
└─────────────────────────────────────────┘
```

## ✨ Key Features

### 1. Numbered Circle Design
- **Số tròn** (1, 2, 3, 4) thay vì radio buttons
- Background xám mặc định
- Chuyển sang **xanh dương** khi hover/selected
- Hiển thị **✓** (checkmark) khi đúng → xanh lá
- Hiển thị **✗** (cross) khi sai → đỏ

### 2. Visual Hierarchy
```
TERM                    ← Label (uppercase, gray)
Question text here?     ← Question (1.5rem, bold, dark)
Choose an answer        ← Instruction (0.875rem, gray)
[Options]               ← Cards with hover effects
[Buttons]               ← Action buttons
```

### 3. Hover Effects
```css
.mc-option:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}
```
- Border chuyển sang xanh
- Shadow xuất hiện
- Card nhấc lên 2px

### 4. Selection State
```css
.mc-option.selected {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.mc-number {
  background: #3b82f6;
  color: white;
}
```

### 5. Answer Feedback
**Correct Answer:**
```
┌─────────────────────────────────┐
│ (✓)  Correct option text        │  ← Green border + background
└─────────────────────────────────┘
```

**Incorrect Answer:**
```
┌─────────────────────────────────┐
│ (✗)  Wrong option text          │  ← Red border + background
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ (✓)  Correct option text        │  ← Green (also shown)
└─────────────────────────────────┘
```

### 6. Button Styling
**Primary (Check Answer):**
- Blue background (#3b82f6)
- White text
- Shadow effect
- Hover: Darker blue + stronger shadow

**Secondary (Don't know?):**
- Transparent background
- Gray text + border
- Hover: Light gray background

## 🎯 HTML Structure

### Old Structure (Verbose)
```html
<label class="flex items-start p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition multichoice-option">
  <input type="radio" name="answer" value="A" class="mt-1 mr-3 w-4 h-4">
  <span class="flex-1 text-lg"><strong>A.</strong> Option text</span>
</label>
```

### New Structure (Clean)
```html
<div class="mc-option" data-answer="A">
  <div class="mc-number">1</div>
  <div class="mc-text">Option text</div>
</div>
```

**Giảm ~70% code HTML!**

## 🔧 CSS Classes

### Container Classes
- `.mc-container` - Main wrapper
- `.mc-header` - "Term" label section
- `.mc-label` - "TERM" text styling
- `.mc-question` - Question text
- `.mc-instruction` - "Choose an answer" text
- `.mc-options` - Grid container for options

### Option Classes
- `.mc-option` - Individual option card
- `.mc-option.selected` - When user clicks
- `.mc-option.correct` - Correct answer after check
- `.mc-option.incorrect` - Wrong answer after check
- `.mc-number` - Numbered circle (1, 2, 3, 4)
- `.mc-text` - Option text content

### Button Classes
- `.mc-btn` - Primary button (Check Answer)
- `.mc-btn-secondary` - Secondary button (Don't know?)
- `.mc-btn-correct` - Success state (green)
- `.mc-btn-incorrect` - Error state (red)

## 📱 Responsive Design

### Desktop (>768px)
- Question: 1.5rem
- Options: 1.125rem
- Number circle: 2.5rem × 2.5rem
- Padding: 1rem 1.25rem

### Mobile (≤768px)
- Question: 1rem - 1.5rem (responsive)
- Options: 0.85rem - 1.1rem
- Number circle: 1.75rem × 1.75rem
- Padding: 0.5rem 0.7rem

### Focus Mode
- All elements scaled down to fit viewport
- No scrollbars
- Question: 1.2rem - 2rem
- Options: 0.9rem - 1.25rem
- Compact spacing

## 🎮 User Interactions

### 1. Initial State
```
TERM
Question text here?
Choose an answer

(1) Option A  ← Gray circle, white background
(2) Option B
(3) Option C
(4) Option D

[Check Answer] (disabled)
[Don't know?]
```

### 2. Hover State
```
(1) Option A  ← Blue border, shadow, lifted
```

### 3. Selected State
```
(1) Option A  ← Blue circle, blue border, blue background
[Check Answer] (enabled)
```

### 4. After Checking (Correct)
```
(✓) Option A  ← Green circle with checkmark
[✓ Correct!] (green button)
[Don't know?] (hidden)

→ Auto-advance in 2 seconds
```

### 5. After Checking (Incorrect)
```
(✗) Option A  ← Red circle with X (user selected)
(✓) Option C  ← Green circle with checkmark (correct)
[✗ Incorrect] (red button)

→ Auto-advance in 2 seconds
```

## 🚀 New Features

### 1. Skip Function
```javascript
function skipQuestion() {
  // Skip to next card without answering
  if (studyType === 'long_term') {
    submitAnswer(false); // Mark as incorrect
  } else {
    nextCard();
  }
}
```

User có thể bỏ qua câu hỏi nếu không biết.

### 2. Dynamic Number Circles
```javascript
options.forEach((opt, index) => {
  html += `
    <div class="mc-option" data-answer="${opt.letter}">
      <div class="mc-number">${index + 1}</div>
      <div class="mc-text">${opt.text}</div>
    </div>`;
});
```

Số thứ tự tự động (1, 2, 3, 4) thay vì A, B, C, D.

### 3. Icon Feedback in Circles
```javascript
if (correctAnswers.includes(letter)) {
  numberEl.innerHTML = '<i class="fas fa-check"></i>';
} else if (letter === selectedAnswer && !isCorrect) {
  numberEl.innerHTML = '<i class="fas fa-times"></i>';
}
```

Checkmark/cross hiển thị trong circle thay vì bên cạnh text.

## 🎨 Color Palette

### Primary Colors
- **Blue**: #3b82f6 (Primary actions, selected state)
- **Green**: #10b981 (Correct answers)
- **Red**: #ef4444 (Incorrect answers)

### Neutral Colors
- **Gray 900**: #1f2937 (Text primary)
- **Gray 700**: #374151 (Text secondary)
- **Gray 500**: #6b7280 (Labels, instructions)
- **Gray 300**: #d1d5db (Borders default)
- **Gray 100**: #f3f4f6 (Number circle default)

### Background Colors
- **Blue Light**: #eff6ff (Selected state)
- **Green Light**: #d1fae5 (Correct state)
- **Red Light**: #fee2e2 (Incorrect state)
- **White**: #ffffff (Default card background)

## 📦 File Changes

### Modified Files
1. **src/views/study/session.ejs**
   - `renderMultiChoiceCard()` - Updated HTML structure
   - `checkMultiChoiceAnswer()` - Updated feedback logic
   - `skipQuestion()` - New function
   - CSS section - Complete redesign (~200 lines)

### No Bootstrap Required
✅ Giữ nguyên **Tailwind CSS**  
✅ Custom CSS cho multi-choice components  
✅ Không cần thêm dependencies  

## ✅ Testing Checklist

### Visual Tests
- [ ] Numbered circles hiển thị đúng (1, 2, 3, 4)
- [ ] Hover effect hoạt động (shadow + transform)
- [ ] Selected state hiển thị xanh
- [ ] Correct answer hiển thị green checkmark
- [ ] Incorrect answer hiển thị red X
- [ ] Typography rõ ràng, dễ đọc
- [ ] "TERM" label và "Choose an answer" hiển thị

### Functional Tests
- [ ] Click vào option → selected
- [ ] Check Answer button enable/disable đúng
- [ ] Feedback hiển thị đúng (correct/incorrect)
- [ ] Auto-advance sau 2 giây
- [ ] "Don't know?" button hoạt động
- [ ] Skip function đúng (mark as incorrect in long_term)

### Responsive Tests
- [ ] Desktop (>1024px): Layout thoải mái
- [ ] Tablet (768-1024px): Vẫn readable
- [ ] Mobile (≤768px): Compact nhưng dùng được
- [ ] Focus Mode: Fit viewport, no scrollbars

### Focus Mode Tests
- [ ] Question + all options vừa màn hình
- [ ] Hover effects vẫn hoạt động
- [ ] Number circles vẫn rõ ràng
- [ ] Buttons không bị cut off

## 🔮 Future Enhancements

### Potential Improvements
1. **Animation** - Smooth transitions khi reveal đáp án
2. **Sound effects** - Âm thanh khi đúng/sai
3. **Progress indicator** - Show số câu đã trả lời
4. **Keyboard shortcuts** - 1, 2, 3, 4 để chọn nhanh
5. **Timer** - Đếm ngược thời gian trả lời
6. **Explanation** - Hiển thị giải thích khi sai
7. **Multiple correct answers** - Support câu hỏi có nhiều đáp án đúng

### Code Optimization
- Extract CSS to separate file
- Create reusable component
- Add TypeScript types
- Unit tests for logic functions

---

**Version**: 2.0  
**Last Updated**: October 22, 2025  
**Style Reference**: Quizlet.com Multi-Choice Interface  
**Related Files**: `src/views/study/session.ejs`
