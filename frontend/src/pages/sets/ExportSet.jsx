import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ExportSet() {
  const { id } = useParams();
  const { flashError } = useApp();

  const [set, setSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [exportFormat, setExportFormat] = useState('custom');
  const [separators, setSeparators] = useState({
    termSep: 'tab',
    noteSep: '||',
    cardSep: 'newline'
  });
  const [preview, setPreview] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (flashcards.length > 0) {
      updatePreview();
    }
  }, [exportFormat, separators, flashcards]);

  const fetchData = async () => {
    try {
      const [setRes, flashcardsRes] = await Promise.all([
        api.get(`/api/sets/${id}`),
        api.get(`/api/sets/${id}/flashcards`)
      ]);
      setSet(setRes.data);
      setFlashcards(flashcardsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      flashError('Failed to load set details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processSeparator = (sep) => {
    if (sep === 'tab' || sep === '\\t') return '\t';
    if (sep === 'newline') return '\n';
    if (sep === '\\n\\n') return '\n\n';
    return sep;
  };

  const updatePreview = () => {
    const previewCards = flashcards.slice(0, 3);

    if (exportFormat === 'custom') {
      const actualTermSep = processSeparator(separators.termSep);
      const actualNoteSep = processSeparator(separators.noteSep);
      const actualCardSep = processSeparator(separators.cardSep);

      const content = previewCards.map(card => {
        let line = `${card.term}${actualTermSep}${card.definition}`;
        if (card.note) {
          line += `${actualNoteSep}${card.note}`;
        }
        return line;
      }).join(actualCardSep);

      setPreview(content + '\n\n... (' + (flashcards.length - 3) + ' more cards)');
    } else {
      // Markdown format
      const content = previewCards.map(card => {
        const defLines = card.definition.split('\n');
        const hasCorrectMarker = defLines.some(line => line.includes('✓ Correct:'));

        if (hasCorrectMarker) {
          // Multi-choice format
          const correctLine = defLines.find(line => line.includes('✓ Correct:'));
          const correctAnswersMatch = correctLine.match(/✓ Correct:\s*([A-Z,\s]+)/);
          const correctAnswers = correctAnswersMatch 
            ? correctAnswersMatch[1].split(',').map(a => a.trim())
            : [];

          const options = defLines.filter(line => line.match(/^[A-Z]\./));

          let md = `### ${card.term}\n\n`;
          options.forEach(opt => {
            const letter = opt.match(/^([A-Z])\./)?.[1];
            const isCorrect = correctAnswers.includes(letter);
            md += `- [${isCorrect ? 'x' : ' '}] ${opt}\n`;
          });

          if (card.note) {
            md += `\nNote: ${card.note}\n`;
          }

          return md;
        } else {
          // Regular flashcard
          let md = `### ${card.term}\n\n`;
          md += `- [x] ${card.definition}\n`;

          if (card.note) {
            md += `\nNote: ${card.note}\n`;
          }

          return md;
        }
      }).join('\n');

      setPreview(content + '\n\n... (' + (flashcards.length - 3) + ' more cards)');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        format: exportFormat
      });

      if (exportFormat === 'custom') {
        params.append('termSep', separators.termSep);
        params.append('noteSep', separators.noteSep);
        params.append('cardSep', separators.cardSep);
      }

      // Trigger download
      window.location.href = `/api/sets/${id}/export?${params.toString()}`;
    } catch (error) {
      console.error('Export failed:', error);
      flashError('Failed to export set. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!set) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Set not found.</p>
        <Link to="/sets" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Sets
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Export Set: {set.name}</h1>

        {/* Format Selection */}
        <div className="mb-8">
          <label className="block text-gray-700 font-bold mb-3">Select Export Format:</label>

          <div className="space-y-4">
            {/* Custom Separator Format */}
            <div
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setExportFormat('custom')}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  id="format-custom"
                  checked={exportFormat === 'custom'}
                  onChange={() => setExportFormat('custom')}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <label htmlFor="format-custom" className="font-semibold text-gray-800 cursor-pointer">
                    Custom Separator Format
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Plain text with customizable separators. Compatible with import feature.
                  </p>
                  {exportFormat === 'custom' && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Term/Definition Separator:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={separators.termSep}
                            onChange={(e) => setSeparators({ ...separators, termSep: e.target.value })}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="tab, \t, or custom"
                          />
                          <span className="text-xs text-gray-500 self-center">Default: TAB</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Note Separator:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={separators.noteSep}
                            onChange={(e) => setSeparators({ ...separators, noteSep: e.target.value })}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="|| or custom"
                          />
                          <span className="text-xs text-gray-500 self-center">Default: ||</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Flashcard Separator:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={separators.cardSep}
                            onChange={(e) => setSeparators({ ...separators, cardSep: e.target.value })}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="newline, \n\n, or custom"
                          />
                          <span className="text-xs text-gray-500 self-center">Default: Single newline</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Markdown Format */}
            <div
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setExportFormat('markdown')}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  id="format-markdown"
                  checked={exportFormat === 'markdown'}
                  onChange={() => setExportFormat('markdown')}
                  className="mt-1"
                />
                <div className="ml-3 flex-1">
                  <label htmlFor="format-markdown" className="font-semibold text-gray-800 cursor-pointer">
                    Markdown Format (Multi-Choice)
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Export as markdown with checkbox format. Perfect for multi-choice questions.
                  </p>
                  <div className="mt-3 bg-gray-100 p-3 rounded text-xs font-mono">
                    <div className="text-gray-700">### Question text here?</div>
                    <div className="text-gray-700 mt-1">- [ ] Wrong option A</div>
                    <div className="text-green-600">- [x] Correct option B</div>
                    <div className="text-gray-700">- [ ] Wrong option C</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-2">
            <i className="fas fa-eye"></i> Preview (first 3 cards):
          </h3>
          <div
            className="bg-white border rounded p-3 font-mono text-sm whitespace-pre-wrap overflow-x-auto"
            style={{ maxHeight: '300px' }}
          >
            {preview || 'Loading preview...'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            <i className="fas fa-download"></i> Download Export File
          </button>
          <Link
            to={`/sets/${id}`}
            className="flex-1 text-center bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold"
          >
            <i className="fas fa-times"></i> Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
