import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StudySession() {
  const { type, id } = useParams(); // type: 'set' or 'folder'
  const navigate = useNavigate();
  const location = useLocation();
  const { flashSuccess, flashError } = useApp();

  // Parse query params
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode') || 'spaced'; // 'spaced' or 'random'
  const filterType = searchParams.get('type') || 'all'; // 'all', 'starred'

  // State
  const [entity, setEntity] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [studyMode, setStudyMode] = useState('multichoice'); // 'flashcard' or 'multichoice'
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [stats, setStats] = useState({ learned: 0, learning: 0, new: 0, starred: 0 });

  // Storage keys
  const storageKey = `study_filter_${type}_${id}`;
  const modeStorageKey = `study_mode_${type}_${id}`;

  // Load data on mount
  useEffect(() => {
    fetchStudyData();
    
    // Load saved filter and mode
    const savedFilter = localStorage.getItem(storageKey) || 'all';
    const savedMode = localStorage.getItem(modeStorageKey) || 'multichoice';
    setCurrentFilter(savedFilter);
    setStudyMode(savedMode);
  }, [type, id, mode, filterType]);

  // Apply filter when flashcards or currentFilter changes
  useEffect(() => {
    if (flashcards.length > 0) {
      applyFilter(currentFilter);
      updateStats();
    }
  }, [flashcards, currentFilter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'enter':
          e.preventDefault();
          handleFlip();
          break;
        case 'f':
          e.preventDefault();
          toggleFocusMode();
          break;
        case 's':
          e.preventDefault();
          toggleStar();
          break;
        case 'escape':
          if (isFocusMode) {
            e.preventDefault();
            toggleFocusMode();
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          e.preventDefault();
          handleNumberKey(parseInt(e.key));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, studyMode, currentIndex, filteredFlashcards, isFocusMode, selectedAnswer]);

  const fetchStudyData = async () => {
    try {
      let endpoint;
      if (mode === 'random') {
        endpoint = `/api/study/${type}/${id}/random?type=${filterType}`;
      } else {
        endpoint = `/api/study/${type}/${id}`;
      }

      const [entityRes, flashcardsRes] = await Promise.all([
        api.get(`/api/${type}s/${id}`),
        api.get(endpoint)
      ]);

      setEntity(entityRes.data);
      setFlashcards(flashcardsRes.data);
    } catch (error) {
      console.error('Failed to fetch study data:', error);
      flashError('Failed to load study data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = () => {
    const learned = flashcards.filter(f => f.is_mastered).length;
    const learning = flashcards.filter(f => !f.is_mastered && f.repetitions > 0).length;
    const newCards = flashcards.filter(f => f.repetitions === 0).length;
    const starred = flashcards.filter(f => f.is_starred).length;

    setStats({ learned, learning, new: newCards, starred });
  };

  const applyFilter = (filter) => {
    let filtered = [];
    switch (filter) {
      case 'learned':
        filtered = flashcards.filter(f => f.is_mastered);
        break;
      case 'learning':
        filtered = flashcards.filter(f => !f.is_mastered && f.repetitions > 0);
        break;
      case 'new':
        filtered = flashcards.filter(f => f.repetitions === 0);
        break;
      case 'starred':
        filtered = flashcards.filter(f => f.is_starred);
        break;
      default:
        filtered = [...flashcards];
    }

    // Auto-switch to available filter if selected has no cards
    if (filtered.length === 0 && filter !== 'all') {
      const availableFilters = ['all', 'learned', 'learning', 'new', 'starred'];
      for (const f of availableFilters) {
        applyFilter(f);
        if (filteredFlashcards.length > 0) {
          setCurrentFilter(f);
          localStorage.setItem(storageKey, f);
          break;
        }
      }
    } else {
      setFilteredFlashcards(filtered);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  const filterCards = (filter) => {
    setCurrentFilter(filter);
    localStorage.setItem(storageKey, filter);
  };

  const switchStudyMode = (mode) => {
    setStudyMode(mode);
    localStorage.setItem(modeStorageKey, mode);
    setIsFlipped(false);
    setSelectedAnswer(null);
  };

  const handleFlip = () => {
    if (studyMode === 'flashcard') {
      setIsFlipped(!isFlipped);
    }
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    if (!isFocusMode) {
      document.body.classList.add('focus-mode-active');
    } else {
      document.body.classList.remove('focus-mode-active');
    }
  };

  const toggleStar = async () => {
    const currentCard = filteredFlashcards[currentIndex];
    if (!currentCard) return;

    try {
      await api.post(`/api/flashcards/${currentCard.id}/toggle-star`);
      
      // Update local state
      const updatedFlashcards = flashcards.map(f => 
        f.id === currentCard.id ? { ...f, is_starred: !f.is_starred } : f
      );
      setFlashcards(updatedFlashcards);
    } catch (error) {
      console.error('Failed to toggle star:', error);
      flashError('Failed to update star. Please try again.');
    }
  };

  const handleNumberKey = (num) => {
    if (studyMode === 'multichoice' && !isFlipped) {
      // Multi-choice mode: 1-4 selects option
      selectMultiChoiceOption(num - 1);
    } else if (studyMode === 'flashcard' && isFlipped && mode === 'spaced') {
      // Flashcard mode after flip: 1-4 for answer quality
      const answers = [false, false, true, true]; // Again, Hard, Good, Easy
      handleAnswer(answers[num - 1]);
    }
  };

  const selectMultiChoiceOption = (index) => {
    const currentCard = filteredFlashcards[currentIndex];
    if (!currentCard || !currentCard.options) return;

    if (index >= 0 && index < currentCard.options.length) {
      setSelectedAnswer(index);
    }
  };

  const checkMultiChoiceAnswer = () => {
    const currentCard = filteredFlashcards[currentIndex];
    if (selectedAnswer === null || !currentCard) return;

    const isCorrect = currentCard.correctAnswers.includes(selectedAnswer);
    
    if (mode === 'spaced') {
      handleAnswer(isCorrect);
    } else {
      // Random mode: just show feedback and move to next
      if (isCorrect) {
        flashSuccess('Correct!');
      } else {
        flashError('Incorrect. The correct answer is: ' + currentCard.options[currentCard.correctAnswers[0]]);
      }
      setTimeout(() => nextCard(), 1500);
    }
  };

  const handleAnswer = async (isCorrect) => {
    const currentCard = filteredFlashcards[currentIndex];
    if (!currentCard) return;

    try {
      await api.post('/api/study/answer', {
        flashcardId: currentCard.id,
        correct: isCorrect
      });

      // Update local state
      const updatedFlashcards = flashcards.map(f => {
        if (f.id === currentCard.id) {
          return {
            ...f,
            repetitions: isCorrect ? (f.repetitions || 0) + 1 : 0,
            is_mastered: isCorrect && (f.consecutive_correct || 0) + 1 >= 4
          };
        }
        return f;
      });
      setFlashcards(updatedFlashcards);

      if (isCorrect) {
        flashSuccess('Correct!');
      } else {
        flashError('Try again!');
      }

      // Move to next card
      setTimeout(() => nextCard(), 1000);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      flashError('Failed to submit answer. Please try again.');
    }
  };

  const nextCard = () => {
    if (currentIndex < filteredFlashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setSelectedAnswer(null);
    } else {
      // End of session
      flashSuccess('Session complete! Great job!');
      navigate(`/${type}s/${id}`);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setSelectedAnswer(null);
    }
  };

  const goBack = () => {
    navigate(`/${type}s/${id}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!entity || filteredFlashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">All done!</h2>
          <p className="text-gray-600 mb-6">
            {mode === 'spaced'
              ? 'No cards due for review right now. Come back later!'
              : 'No flashcards available for this study mode.'}
          </p>
          <button
            onClick={goBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>
      </div>
    );
  }

  const currentCard = filteredFlashcards[currentIndex];
  const progress = ((currentIndex + 1) / filteredFlashcards.length) * 100;

  // Parse multi-choice options
  let options = [];
  let correctAnswers = [];
  if (studyMode === 'multichoice') {
    const defLines = currentCard.definition.split('\n');
    const hasCorrectMarker = defLines.some(line => line.includes('✓ Correct:'));

    if (hasCorrectMarker) {
      // Multi-choice format
      options = defLines.filter(line => line.match(/^[A-D]\./));
      const correctLine = defLines.find(line => line.includes('✓ Correct:'));
      const correctMatch = correctLine?.match(/✓ Correct:\s*([A-D,\s]+)/);
      if (correctMatch) {
        correctAnswers = correctMatch[1].split(',').map(a => {
          const letter = a.trim();
          return letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        });
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6" id="study-container">
      {/* Header */}
      <div className="mb-4 sm:mb-6 hide-in-fullscreen" id="header-section">
        <div className="flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1
              onClick={goBack}
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 cursor-pointer hover:text-blue-600 transition truncate"
            >
              <i className="fas fa-arrow-left text-blue-600 text-base sm:text-xl"></i> {entity.name}
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">
              {mode === 'spaced' ? 'Long-term learning with spaced repetition' : `Random practice - ${filterType === 'starred' ? 'Starred cards only' : 'All cards'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 hide-in-fullscreen" id="stats-section">
        <button
          onClick={() => filterCards('all')}
          className={`stat-card bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-2 text-center col-span-2 sm:col-span-1 ${
            currentFilter === 'all' ? 'border-blue-500' : 'border-transparent hover:border-blue-300'
          }`}
        >
          <p className="text-gray-600 text-xs sm:text-sm mb-0.5 sm:mb-1">Total</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">{flashcards.length}</p>
        </button>
        <button
          onClick={() => filterCards('learned')}
          className={`stat-card bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-2 text-center ${
            currentFilter === 'learned' ? 'border-green-500' : 'border-transparent hover:border-green-300'
          }`}
        >
          <p className="text-gray-600 text-xs sm:text-sm mb-0.5 sm:mb-1">Learned</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.learned}</p>
        </button>
        <button
          onClick={() => filterCards('learning')}
          className={`stat-card bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-2 text-center ${
            currentFilter === 'learning' ? 'border-yellow-500' : 'border-transparent hover:border-yellow-300'
          }`}
        >
          <p className="text-gray-600 text-xs sm:text-sm mb-0.5 sm:mb-1">Learning</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{stats.learning}</p>
        </button>
        <button
          onClick={() => filterCards('new')}
          className={`stat-card bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-2 text-center ${
            currentFilter === 'new' ? 'border-blue-500' : 'border-transparent hover:border-blue-300'
          }`}
        >
          <p className="text-gray-600 text-xs sm:text-sm mb-0.5 sm:mb-1">New</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{stats.new}</p>
        </button>
        <button
          onClick={() => filterCards('starred')}
          className={`stat-card bg-white p-2 sm:p-3 lg:p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-2 text-center ${
            currentFilter === 'starred' ? 'border-yellow-500' : 'border-transparent hover:border-yellow-300'
          }`}
        >
          <p className="text-gray-600 text-xs sm:text-sm mb-0.5 sm:mb-1">Stars</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-500">{stats.starred}</p>
        </button>
      </div>

      {/* Study Interface */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 mb-4" id="flashcard-section">
        {/* Mode Selector */}
        <div className="mb-3 sm:mb-4 text-center hide-in-fullscreen">
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden w-full sm:w-auto">
            <button
              onClick={() => switchStudyMode('flashcard')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium transition ${
                studyMode === 'flashcard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className="fas fa-layer-group"></i> <span className="hidden xs:inline">Flashcard</span><span className="xs:hidden">Flash</span>
            </button>
            <button
              onClick={() => switchStudyMode('multichoice')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium transition ${
                studyMode === 'multichoice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className="fas fa-list-ul"></i> <span className="hidden xs:inline">Multi-Choice</span><span className="xs:hidden">Multi</span>
            </button>
          </div>
        </div>

        {/* Filter Info */}
        <div className="mb-3 sm:mb-4 text-center hide-in-fullscreen">
          <span className="text-xs sm:text-sm bg-blue-100 text-blue-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full inline-block">
            <i className="fas fa-filter text-xs sm:text-sm"></i> <span className="hidden xs:inline">Showing:</span>{' '}
            {currentFilter === 'all' ? 'All Cards' : currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4 sm:mb-6" id="progress-section">
          <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <div className="flex items-center gap-3">
              <span>
                {currentIndex + 1} / {filteredFlashcards.length}
              </span>
              {isFocusMode && (
                <button
                  onClick={toggleFocusMode}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition text-xs font-semibold flex items-center gap-1.5"
                >
                  <i className="fas fa-times"></i>
                  <span>Exit</span>
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-2 sm:mb-3 relative" id="flashcard-container">
          {/* Star Button */}
          <button
            onClick={toggleStar}
            className={`absolute top-2 right-2 z-10 w-10 h-10 flex items-center justify-center rounded-full transition hover:scale-115 ${
              currentCard.is_starred
                ? 'text-yellow-500'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            style={{ background: 'transparent', border: 'none' }}
          >
            <i className="fas fa-star text-2xl"></i>
          </button>

          {studyMode === 'flashcard' ? (
            /* Flashcard Mode with 3D Flip */
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
              <div className="flashcard-inner">
                <div className="flashcard-front bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="text-center w-full pt-4 sm:pt-6 lg:pt-8 h-full flex flex-col">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1 flex-shrink-0">
                      <i className="fas fa-sync-alt"></i> Click to flip
                    </p>
                    <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 overflow-y-auto flex-1 py-2 sm:py-3 lg:py-4 px-2 sm:px-4">
                      {currentCard.term}
                    </div>
                  </div>
                </div>

                <div className="flashcard-back bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="text-center w-full pt-4 sm:pt-6 lg:pt-8 h-full flex flex-col">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1 flex-shrink-0">
                      <i className="fas fa-sync-alt"></i> Click to flip
                    </p>
                    <div className="text-base sm:text-lg lg:text-xl text-gray-800 overflow-y-auto flex-1 px-2 sm:px-4">
                      {currentCard.definition}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Multi-Choice Mode */
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6 lg:p-8" style={{ minHeight: '300px' }}>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 mb-6 text-center">
                {currentCard.term}
              </h3>
              {options.length > 0 ? (
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => selectMultiChoiceOption(index)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-gray-300 bg-white hover:border-blue-300'
                      }`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                      {option.substring(3)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p>No multi-choice options available for this card.</p>
                  <p className="text-sm mt-2">Switch to Flashcard mode to study this card.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LEARN Button */}
        <div className="flex justify-center items-center mt-3 sm:mt-4 hide-in-fullscreen">
          <button
            onClick={toggleFocusMode}
            className="text-white px-8 sm:px-10 lg:px-12 py-3 sm:py-3.5 lg:py-4 rounded-lg sm:rounded-xl transition font-bold text-base sm:text-lg lg:text-xl flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full sm:w-auto"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', maxWidth: '400px' }}
          >
            <i className="fas fa-graduation-cap text-lg sm:text-xl lg:text-2xl"></i>
            <span>LEARN</span>
          </button>
        </div>

        {/* Answer Buttons */}
        <div className="mt-4">
          {mode === 'spaced' ? (
            /* Long-term Study: Prev/Incorrect/Correct/Next */
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 lg:gap-4">
              <button
                onClick={previousCard}
                disabled={currentIndex === 0}
                className="bg-gray-500 text-white py-2 sm:py-2.5 lg:py-3 px-2 sm:px-4 lg:px-6 rounded-md sm:rounded-lg hover:bg-gray-600 transition font-semibold flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base flex-1 sm:flex-initial min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-arrow-left text-xs sm:text-sm"></i>
                <span className="hidden xs:inline truncate">Prev</span>
              </button>
              {studyMode === 'flashcard' && isFlipped && (
                <>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="bg-red-500 text-white py-2 sm:py-2.5 lg:py-3 px-2 sm:px-4 lg:px-6 rounded-md sm:rounded-lg hover:bg-red-600 transition font-semibold flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base flex-1 min-w-0"
                  >
                    <i className="fas fa-times-circle text-xs sm:text-sm"></i>
                    <span className="truncate">Incorrect</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="bg-green-500 text-white py-2 sm:py-2.5 lg:py-3 px-2 sm:px-4 lg:px-6 rounded-md sm:rounded-lg hover:bg-green-600 transition font-semibold flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base flex-1 min-w-0"
                  >
                    <i className="fas fa-check-circle text-xs sm:text-sm"></i>
                    <span className="truncate">Correct</span>
                  </button>
                </>
              )}
              {studyMode === 'multichoice' && (
                <button
                  onClick={checkMultiChoiceAnswer}
                  disabled={selectedAnswer === null}
                  className="bg-blue-600 text-white py-2 sm:py-2.5 lg:py-3 px-4 sm:px-5 lg:px-6 rounded-md sm:rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm lg:text-base flex-1"
                >
                  <i className="fas fa-check-circle"></i>
                  <span>Check Answer</span>
                </button>
              )}
              <button
                onClick={nextCard}
                className="bg-blue-500 text-white py-2 sm:py-2.5 lg:py-3 px-2 sm:px-4 lg:px-6 rounded-md sm:rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base flex-1 sm:flex-initial min-w-0"
              >
                <i className="fas fa-arrow-right text-xs sm:text-sm"></i>
                <span className="hidden xs:inline truncate">Next</span>
              </button>
            </div>
          ) : (
            /* Random Study: Just Next button */
            <div className="flex justify-center">
              <button
                onClick={nextCard}
                className="flex-1 sm:flex-none bg-blue-500 text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <i className="fas fa-arrow-right"></i>
                <span>Next Card</span>
              </button>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="mt-4 text-center hide-in-fullscreen">
          <p className="text-xs text-gray-500">
            <i className="fas fa-keyboard"></i> Shortcuts: <strong>Space</strong>=Flip, <strong>F</strong>=Focus, <strong>S</strong>=Star,{' '}
            <strong>1-4</strong>=Answer, <strong>Esc</strong>=Exit Focus
          </p>
        </div>
      </div>
    </div>
  );
}
