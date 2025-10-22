# Multi-Choice Mode Fix

## 🐛 Issues Fixed

### 1. Field Name Error
**Problem**: Code used `card.term` but flashcard objects use `card.word`
**Fix**: Changed all references from `term` to `word` in:
- `isMultiChoiceCard()` function
- `renderMultiChoiceCard()` function

### 2. Default Mode
**Problem**: Flashcard mode was default
**Fix**: 
- Changed default to `multichoice`
- Updated button initial states (Multi-Choice = blue, Flashcard = white)
- Default hint text: "Multi-choice mode active"

### 3. localStorage Support
**Problem**: Mode preference not saved
**Fix**:
- Added `modeStorageKey` = `study_mode_{entityType}_{entityId}`
- Save mode when switching: `localStorage.setItem(modeStorageKey, mode)`
- Load on page init: `localStorage.getItem(modeStorageKey) || 'multichoice'`
- Call `updateModeButtons()` on init to sync UI

## ✅ How It Works Now

### On Page Load
1. Load saved mode from localStorage (default: `multichoice`)
2. Update button styles to match loaded mode
3. Load first card with appropriate rendering

### When Switching Modes
1. Save new mode to localStorage
2. Update button styles
3. Reload current card with new rendering

### Format Detection
```javascript
function isMultiChoiceCard(card) {
  // Check definition: "Correct: A" or "Correct: A, C"
  const hasCorrectFormat = card.definition.match(/^Correct:\s*[A-Z]/i);
  
  // Check word: has "A. ", "B. ", etc.
  const hasOptionsFormat = card.word.match(/[A-Z]\.\s+/);
  
  return hasCorrectFormat && hasOptionsFormat;
}
```

### Rendering Logic
```javascript
if (studyMode === 'multichoice' && isMultiChoiceCard(card)) {
  // Hide normal answer buttons
  answerButtonsSection.style.display = 'none';
  
  // Render A, B, C, D options with radio buttons
  renderMultiChoiceCard(card);
} else {
  // Show normal answer buttons (Correct/Incorrect or Next)
  answerButtonsSection.style.display = 'block';
  
  // Render regular flashcard
  card.word → front, card.definition → back
}
```

## 🎯 Expected Behavior

### Scenario 1: Fresh Visit (No localStorage)
- Mode: **Multi-Choice** (default)
- Button: Multi-Choice = blue, Flashcard = white
- Cards with format → A, B, C, D options
- Cards without format → flip card

### Scenario 2: Switch to Flashcard
- Click "Flashcard" button
- Mode saved to localStorage
- All cards → flip card interface
- Correct/Incorrect buttons visible

### Scenario 3: Return Visit
- Load saved mode from localStorage
- If was "flashcard" → starts in flashcard mode
- If was "multichoice" → starts in multichoice mode
- Mode persists across page refreshes

## 🧪 Test Checklist

- [ ] Import flashcards from markdown (`sample-markdown-import.md`)
- [ ] Start study session
- [ ] Verify Multi-Choice button is blue (active)
- [ ] Verify cards show A, B, C, D options
- [ ] Click option → "Check Answer" button enables
- [ ] Click "Check Answer" → correct/wrong highlighting
- [ ] Auto-advance to next card after 2 seconds
- [ ] Switch to Flashcard mode → see flip cards
- [ ] Refresh page → mode persists (localStorage)
- [ ] Test with regular flashcards → fallback to flip cards

## 📝 Files Modified

1. **src/views/study/session.ejs**
   - Fixed field names: `card.term` → `card.word`
   - Default mode: `'flashcard'` → `'multichoice'`
   - Added localStorage: save/load mode preference
   - Added `updateModeButtons()` function
   - Fixed button initial states
   - Fixed detection in `isMultiChoiceCard()`
   - Fixed parsing in `renderMultiChoiceCard()`

## 🚀 Ready to Test

```bash
npm run dev
# Navigate to any set
# Click "Study"
# Should see Multi-Choice mode active by default
# Cards with "Correct: A" format → show options
# Cards without format → flip cards
```
