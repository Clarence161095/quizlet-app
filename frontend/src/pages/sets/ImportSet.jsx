import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ImportSet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { flashSuccess, flashError } = useApp();

  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    termDefinitionSeparator: '|',
    noteSeparator: '|',
    flashcardSeparator: '===',
    content: ''
  });

  const [preview, setPreview] = useState([]);

  useEffect(() => {
    fetchSet();
  }, [id]);

  const fetchSet = async () => {
    try {
      const response = await api.get(`/api/sets/${id}`);
      setSet(response.data);
    } catch (error) {
      console.error('Failed to fetch set:', error);
      flashError('Failed to load set details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const processSeparator = (sep) => {
    if (!sep) return sep;
    // Handle special separators
    if (sep === 'tab' || sep === '\\t') return '\t';
    if (sep === '\\n\\n') return '\n\n';
    return sep;
  };

  const generatePreview = () => {
    try {
      const { content, termDefinitionSeparator, noteSeparator, flashcardSeparator } = formData;

      if (!content.trim()) {
        setPreview([]);
        return;
      }

      const termDefSep = processSeparator(termDefinitionSeparator);
      const noteSep = processSeparator(noteSeparator);
      const cardSep = processSeparator(flashcardSeparator);

      const flashcardTexts = content.split(cardSep);
      const parsed = [];

      flashcardTexts.forEach((text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const parts = trimmed.split(termDefSep);
        if (parts.length < 2) return; // Need at least term and definition

        const term = parts[0].trim();
        let definition = parts[1].trim();
        let note = '';

        // Check for note separator
        if (noteSep && parts.length >= 3) {
          definition = parts[1].trim();
          note = parts[2].trim();
        } else if (noteSep && parts[1].includes(noteSep)) {
          const defParts = parts[1].split(noteSep);
          definition = defParts[0].trim();
          note = defParts[1].trim();
        }

        parsed.push({ term, definition, note });
      });

      setPreview(parsed);
    } catch (error) {
      console.error('Preview generation failed:', error);
      flashError('Failed to generate preview. Please check your separators.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (preview.length === 0) {
      flashError('Please preview your flashcards before importing.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post(`/api/sets/${id}/import`, {
        termDefinitionSeparator: processSeparator(formData.termDefinitionSeparator),
        noteSeparator: processSeparator(formData.noteSeparator),
        flashcardSeparator: processSeparator(formData.flashcardSeparator),
        content: formData.content
      });

      flashSuccess(`Successfully imported ${preview.length} flashcard(s)!`);
      navigate(`/sets/${id}`);
    } catch (error) {
      console.error('Failed to import flashcards:', error);
      flashError(error.response?.data?.error || 'Failed to import flashcards. Please try again.');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to={`/sets/${id}`} className="text-blue-600 hover:underline">
          <i className="fas fa-arrow-left"></i> Back to Set
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          <i className="fas fa-file-import text-blue-600"></i> Import Flashcards
        </h1>

        {/* Instructions */}
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Import Format:</strong> Each flashcard should be separated by the "Flashcard Separator". Within each flashcard, use "Term/Definition Separator" to separate the term and definition. Optionally, use "Note Separator" to add a personal note.
          </p>
          <div className="bg-white p-3 rounded mt-2">
            <p className="text-xs font-semibold text-gray-700 mb-1">Example with default separators:</p>
            <code className="text-xs block text-gray-800 whitespace-pre-wrap font-mono">
              {`Hello | Xin chào | Greeting phrase
===
Thank you | Cảm ơn | Polite expression
===
Goodbye | Tạm biệt`}
            </code>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            <strong>Tip:</strong> You can type "tab" for tab character, "\t" for tab, or any custom text as separator.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Separators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="termDefinitionSeparator" className="block text-gray-700 font-semibold mb-2">
                Term/Definition Separator <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="termDefinitionSeparator"
                name="termDefinitionSeparator"
                value={formData.termDefinitionSeparator}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g., |, tab, ;"
              />
              <p className="text-xs text-gray-500 mt-1">Separates term from definition</p>
            </div>

            <div>
              <label htmlFor="noteSeparator" className="block text-gray-700 font-semibold mb-2">
                Note Separator
              </label>
              <input
                type="text"
                id="noteSeparator"
                name="noteSeparator"
                value={formData.noteSeparator}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g., |, ::, #"
              />
              <p className="text-xs text-gray-500 mt-1">Separates definition from note (optional)</p>
            </div>

            <div>
              <label htmlFor="flashcardSeparator" className="block text-gray-700 font-semibold mb-2">
                Flashcard Separator <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="flashcardSeparator"
                name="flashcardSeparator"
                value={formData.flashcardSeparator}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="e.g., ===, ---, \n\n"
              />
              <p className="text-xs text-gray-500 mt-1">Separates each flashcard</p>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="content" className="block text-gray-700 font-semibold">
                Flashcard Data <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generatePreview}
                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded transition"
              >
                <i className="fas fa-sync"></i> Preview Now
              </button>
            </div>
            <textarea
              id="content"
              name="content"
              rows="12"
              value={formData.content}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
              placeholder="Paste your flashcard data here..."
            />
            <p className="text-sm text-gray-500 mt-2">
              <i className="fas fa-info-circle"></i> Click "Preview Now" button to preview your flashcards before importing.
            </p>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 font-semibold">Preview</label>
              <span className="text-sm text-gray-600">{preview.length} flashcards</span>
            </div>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[100px] max-h-[300px] overflow-y-auto">
              {preview.length === 0 ? (
                <p className="text-gray-400 text-sm">Preview will appear here...</p>
              ) : (
                <div className="space-y-3">
                  {preview.map((card, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1">#{index + 1}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">TERM</p>
                          <p className="text-gray-800">{card.term}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-semibold">DEFINITION</p>
                          <p className="text-gray-800">{card.definition}</p>
                        </div>
                      </div>
                      {card.note && (
                        <div className="mt-2 text-sm">
                          <p className="text-xs text-gray-600 font-semibold">NOTE</p>
                          <p className="text-gray-600 italic">{card.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting || preview.length === 0}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-check"></i> {submitting ? 'Importing...' : 'Import'}
            </button>
            <Link
              to={`/sets/${id}`}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition inline-block"
            >
              <i className="fas fa-times"></i> Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
