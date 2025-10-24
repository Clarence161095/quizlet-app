import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ViewSet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { flashSuccess, flashError } = useApp();

  const [set, setSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [stats, setStats] = useState({ learned: 0, learning: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    fetchSetDetails();
  }, [id]);

  const fetchSetDetails = async () => {
    try {
      const [setRes, flashcardsRes, statsRes] = await Promise.all([
        api.get(`/api/sets/${id}`),
        api.get(`/api/sets/${id}/flashcards`),
        api.get(`/api/sets/${id}/stats`)
      ]);

      setSet(setRes.data);
      setFlashcards(flashcardsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch set details:', error);
      flashError('Failed to load set details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/sets/${id}`);
      flashSuccess('Set deleted successfully!');
      navigate('/sets');
    } catch (error) {
      console.error('Failed to delete set:', error);
      flashError(error.response?.data?.error || 'Failed to delete set. Please try again.');
    }
  };

  const handleUpdateFromSource = async () => {
    try {
      await api.post(`/api/shares/sets/${id}/update-from-source`);
      flashSuccess('Set updated from source successfully!');
      fetchSetDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update from source:', error);
      flashError(error.response?.data?.error || 'Failed to update from source. Please try again.');
    }
    setShowUpdateDialog(false);
  };

  const handleDeleteFlashcard = async (flashcardId) => {
    if (!confirm('Delete this flashcard?')) return;

    try {
      await api.delete(`/api/flashcards/${flashcardId}`);
      flashSuccess('Flashcard deleted successfully!');
      fetchSetDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
      flashError('Failed to delete flashcard. Please try again.');
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

  const isCloned = !!set.source_set_id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              <i className="fas fa-layer-group text-blue-600"></i> {set.name}
            </h1>
            {set.description && (
              <p className="text-sm sm:text-base text-gray-600">{set.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:gap-2">
            {isCloned ? (
              /* Cloned set: Show Update button, hide Edit button */
              <button
                onClick={() => setShowUpdateDialog(true)}
                className="flex-1 sm:flex-initial bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 text-sm whitespace-nowrap"
              >
                <i className="fas fa-sync"></i> Update
              </button>
            ) : (
              /* Original set: Show Edit button */
              <Link
                to={`/sets/${id}/edit`}
                className="flex-1 sm:flex-initial text-center bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-300 text-sm whitespace-nowrap"
              >
                <i className="fas fa-edit"></i> Edit
              </Link>
            )}
            <Link
              to={`/shares/sets/${id}`}
              className="flex-1 sm:flex-initial text-center bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
            >
              <i className="fas fa-share-alt"></i> Share
            </Link>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 sm:flex-initial bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-600 text-sm whitespace-nowrap"
            >
              <i className="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Cards</p>
          <p className="text-2xl font-bold text-gray-800">{flashcards.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Learned</p>
          <p className="text-2xl font-bold text-green-600">{stats.learned || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Learning</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.learning || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">New</p>
          <p className="text-2xl font-bold text-blue-600">
            {flashcards.length - (stats.learned || 0)}
          </p>
        </div>
      </div>

      {/* Study Options */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          <i className="fas fa-bolt text-yellow-500"></i> Study Options
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to={`/study/set/${id}`}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition text-center"
          >
            <i className="fas fa-brain"></i> Long-term Learning
          </Link>
          <Link
            to={`/study/set/${id}?mode=random&type=all`}
            className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition text-center"
          >
            <i className="fas fa-random"></i> Random All
          </Link>
          <Link
            to={`/study/set/${id}?mode=random&type=starred`}
            className="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition text-center"
          >
            <i className="fas fa-star"></i> Random Starred
          </Link>
          <Link
            to={`/sets/${id}/import`}
            className="bg-indigo-500 text-white px-4 py-3 rounded-lg hover:bg-indigo-600 transition text-center"
          >
            <i className="fas fa-file-import"></i> Import Cards
          </Link>
        </div>
      </div>

      {/* Flashcards */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            <i className="fas fa-cards text-blue-500"></i> Flashcards ({flashcards.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {isCloned ? (
              /* Cloned set: Only show Export if allowed */
              set.allow_export ? (
                <Link
                  to={`/sets/${id}/export`}
                  className="flex-1 xs:flex-initial text-center bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm whitespace-nowrap"
                >
                  <i className="fas fa-download"></i> Export
                </Link>
              ) : (
                <span
                  className="flex-1 xs:flex-initial text-center bg-gray-100 text-gray-400 px-3 py-2 rounded-lg text-sm cursor-not-allowed whitespace-nowrap"
                  title="Export disabled by owner"
                >
                  <i className="fas fa-lock"></i> Locked
                </span>
              )
            ) : (
              /* Original set: Show all buttons */
              <>
                <Link
                  to={`/sets/${id}/export`}
                  className="flex-1 xs:flex-initial text-center bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 text-sm whitespace-nowrap"
                >
                  <i className="fas fa-download"></i> Export
                </Link>
                <Link
                  to={`/sets/${id}/import`}
                  className="flex-1 xs:flex-initial text-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                >
                  <i className="fas fa-file-import"></i> Import
                </Link>
                <Link
                  to={`/flashcards/create/${id}`}
                  className="flex-1 xs:flex-initial text-center bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                >
                  <i className="fas fa-plus"></i> Add Card
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Flashcards List */}
        {flashcards.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <i className="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
            <p>No flashcards yet.</p>
            {!isCloned && (
              <Link
                to={`/flashcards/create/${id}`}
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Add your first flashcard
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {flashcards.map((card, index) => (
              <div key={card.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm text-gray-500 font-semibold">#{index + 1}</span>
                  {!isCloned && (
                    <div className="flex gap-2">
                      <Link
                        to={`/flashcards/${card.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <button
                        onClick={() => handleDeleteFlashcard(card.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">TERM</p>
                    <p className="text-gray-800">{card.term}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">DEFINITION</p>
                    <p className="text-gray-800">{card.definition}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Set"
        message="Are you sure you want to delete this set and all its flashcards? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Update from Source Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        onConfirm={handleUpdateFromSource}
        title="Update from Source"
        message="This will replace all flashcards with the latest from source. Your learning progress will be kept. Continue?"
        confirmText="Update"
      />
    </div>
  );
}
