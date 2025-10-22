# Focus Mode Feature

## 🎯 Overview

**Focus Mode** là chế độ tập trung tối đa vào nội dung flashcard, khác với Fullscreen:
- **Fullscreen** = Browser fullscreen API
- **Focus Mode** = Ẩn tất cả UI, chỉ hiển thị flashcard/multichoice

## 🆚 Comparison

| Feature | Normal Mode | Fullscreen Mode | Focus Mode |
|---------|-------------|-----------------|------------|
| Browser chrome | Visible | Hidden | Visible |
| Header/Title | Visible | Hidden | Hidden |
| Stats cards | Visible | Hidden | Hidden |
| Mode selector | Visible | Hidden | Hidden |
| Progress bar | Visible | Hidden | Hidden |
| Answer buttons | Visible | Visible | Hidden |
| Filter info | Visible | Hidden | Hidden |
| Star button | Visible | Hidden | Hidden |
| Card info | Visible | Hidden | Hidden |
| Flashcard size | 350px | 98vh | 95vh |
| Padding | Normal | Minimal | None |
| Font scaling | Fixed | clamp(1.5-3rem) | clamp(1.2-2.5rem) |
| Scroll | Auto | Auto | Hidden (overflow: hidden) |

## 🎨 UI Elements

### Button Appearance

**Normal State:**
```
[🟣 Focus] [⚪ Fullscreen]
Purple      Gray
```

**Active State:**
```
[🔴 Exit Focus]
Red, Fixed position (top-right)
```

### Focus Mode Layout

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│          [🔴 Exit] (top-right)          │
│                                         │
│     ┌─────────────────────────────┐    │
│     │                             │    │
│     │   FLASHCARD CONTENT ONLY    │    │
│     │                             │    │
│     │   Auto-scaled font size     │    │
│     │   No scrollbar (if possible)│    │
│     │                             │    │
│     └─────────────────────────────┘    │
│                                         │
│                                         │
└─────────────────────────────────────────┘
        95vw x 95vh (maximized)
```

## 💡 Key Features

### 1. **Content Maximization**
- Container: 100vw x 100vh
- Flashcard: 95vw x 95vh (leaves small margin)
- All UI elements hidden
- Only exit button visible (fixed top-right)

### 2. **Auto Font Scaling**
```css
/* Flashcard content */
font-size: clamp(1.2rem, 3vw, 2.5rem);

/* Multi-choice options */
font-size: clamp(1rem, 2.5vw, 1.8rem);

/* Check answer button */
font-size: clamp(1rem, 2.5vw, 1.5rem);
```

### 3. **No Scrollbars**
```css
body.focus-mode-active {
  overflow: hidden;
}

#word-content, #definition-content {
  overflow: hidden; /* Try to avoid scrolling */
  display: flex;
  align-items: center; /* Center content */
}
```

### 4. **Minimal Padding**
```css
/* Flashcard faces */
padding: 2rem 3rem; /* Minimal padding */

/* Mobile */
@media (max-width: 768px) {
  padding: 1rem; /* Even less on mobile */
}
```

## 🔧 Technical Implementation

### JavaScript Functions

```javascript
let isFocusMode = false;

function toggleFocusMode() {
  isFocusMode = !isFocusMode;
  
  if (isFocusMode) {
    // Add class to body
    document.body.classList.add('focus-mode-active');
    
    // Hide ALL elements except flashcard
    header.style.display = 'none';
    stats.style.display = 'none';
    modeSelector.style.display = 'none';
    filterInfo.style.display = 'none';
    progressSection.style.display = 'none';
    answerButtons.style.display = 'none';
    noteSection.style.display = 'none';
    starSection.style.display = 'none';
    cardInfo.style.display = 'none';
    
    // Maximize flashcard
    flashcardContainer.style.height = 'calc(100vh - 60px)';
    
    // Update button to exit mode
    btn.classList.add('fixed', 'top-4', 'right-4', 'z-50');
  } else {
    // Restore everything
    document.body.classList.remove('focus-mode-active');
    // Show all hidden elements...
  }
}
```

### CSS Strategy

1. **Body-level class**: `body.focus-mode-active`
   - Prevents other elements from interfering
   - Global overflow hidden

2. **Container styling**: 100vw x 100vh
   - Full viewport coverage
   - Centered flashcard

3. **Flashcard sizing**: 95vw x 95vh
   - Leaves small margin
   - Prevents content touching edges

4. **Text scaling**: `clamp(min, ideal, max)`
   - Responsive sizing
   - Adapts to content length
   - Tries to avoid scrolling

## 🎮 Usage

### Enter Focus Mode
```
1. Click purple "Focus" button
2. All UI disappears
3. Flashcard maximized
4. Hint appears for 2 seconds
5. Only exit button (red) visible
```

### Exit Focus Mode
```
1. Click red exit button (top-right)
2. All UI restored
3. Flashcard returns to normal size
4. Purple "Focus" button reappears
```

### Keyboard Shortcuts
- **Space**: Flip card (works in focus mode)
- **← Arrow**: Incorrect (if visible)
- **→ Arrow**: Correct/Next (if visible)
- **F**: Toggle fullscreen (separate feature)
- **ESC**: Exit fullscreen (not focus mode)

## 📱 Responsive Behavior

### Desktop (> 768px)
- Font: 1.2rem → 3vw → 2.5rem
- Padding: 2rem 3rem
- Full 95vw x 95vh usage

### Mobile (≤ 768px)
- Font: 1rem → 4vw → 2rem
- Padding: 1rem
- Adjusted for small screens

## 🆕 What's Different from Fullscreen?

| Aspect | Fullscreen | Focus Mode |
|--------|-----------|------------|
| **Browser UI** | Hidden (native API) | Visible |
| **Study UI** | Most hidden | ALL hidden |
| **Answer Buttons** | Visible | Hidden |
| **Exit Method** | ESC or button | Button only |
| **Note Section** | Visible | Hidden |
| **Star Button** | Hidden | Hidden |
| **Use Case** | Presentation/demo | Deep focus study |

## 💭 Design Philosophy

**Focus Mode** is designed for:
- ✅ Deep concentration
- ✅ Minimizing distractions
- ✅ Maximizing content visibility
- ✅ Self-paced review (no buttons pressuring you)
- ✅ Pure flashcard/quiz interface

**NOT designed for:**
- ❌ Long-term spaced repetition (no answer buttons)
- ❌ Quick navigation (no stats/filters)
- ❌ Multi-tasking (hides everything)

## 🚀 Best Practices

1. **Use for final review**: When you know content well
2. **Combine with multi-choice**: Great for quiz practice
3. **Exit to mark answers**: Toggle off to use Correct/Incorrect
4. **Mobile friendly**: Works great on tablets/phones
5. **Quick toggle**: Purple button always accessible

## 🐛 Troubleshooting

### Text too small
- Content is automatically scaled
- Try zooming browser (Cmd/Ctrl +)
- Or switch to normal mode for fixed size

### Scrollbar appears
- Very long content may still need scrolling
- Font auto-scales but has limits (clamp max)
- Consider breaking long flashcards into smaller ones

### Can't exit
- Red button always visible (top-right)
- Fixed position, z-index 50
- Can't be hidden by content

### Multi-choice buttons cut off
- Options auto-scale: clamp(1rem, 2.5vw, 1.8rem)
- Check Answer button scales: clamp(1rem, 2.5vw, 1.5rem)
- Should fit on most screens

## 📚 Related Features

- **Fullscreen Mode**: Browser fullscreen with study UI
- **Multi-Choice Mode**: Interactive quiz interface
- **Note Section**: Hidden in focus, use View Note button in normal mode
- **Star Toggle**: Hidden in focus, use normal mode to star cards
