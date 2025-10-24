import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ViewFolder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { flashSuccess, flashError } = useApp();

  const [folder, setFolder] = useState(null);
  const [sets, setSets] = useState([]);
  const [stats, setStats] = useState({ learned: 0, learning: 0 });
  const [flashcardsCount, setFlashcardsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    fetchFolderDetails();
  }, [id]);

  const fetchFolderDetails = async () => {
    try {
      const [folderRes, setsRes, statsRes] = await Promise.all([
        api.get(`/api/folders/${id}`),
        api.get(`/api/folders/${id}/sets`),
        api.get(`/api/folders/${id}/stats`)
      ]);

      setFolder(folderRes.data);
      setSets(setsRes.data);
      setStats(statsRes.data);
      
      // Calculate total flashcards from all sets
      const totalCards = setsRes.data.reduce((sum, set) => sum + (set.flashcard_count || 0), 0);
      setFlashcardsCount(totalCards);
    } catch (error) {
      console.error('Failed to fetch folder details:', error);
      flashError('Failed to load folder details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/folders/${id}`);
      flashSuccess('Folder deleted successfully!');
      navigate('/folders');
    } catch (error) {
      console.error('Failed to delete folder:', error);
      flashError(error.response?.data?.error || 'Failed to delete folder. Please try again.');
    }
  };

  const handleUpdateFromSource = async () => {
    try {
      await api.post(`/api/shares/folders/${id}/update-from-source`);
      flashSuccess('Folder updated from source successfully!');
      fetchFolderDetails(); // Refresh data
    } catch (error) {
      console.error('Failed to update from source:', error);
      flashError(error.response?.data?.error || 'Failed to update from source. Please try again.');
    }
    setShowUpdateDialog(false);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!folder) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Folder not found.</p>
        <Link to="/folders" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Folders
        </Link>
      </div>
    );
  }

  const isCloned = !!folder.source_folder_id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              <i className="fas fa-folder-open text-yellow-500"></i> {folder.name}
            </h1>
            {folder.description && (
              <p className="text-gray-600">{folder.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isCloned ? (
              <button
                onClick={() => setShowUpdateDialog(true)}
                className="flex-1 sm:flex-initial bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition text-sm whitespace-nowrap"
              >
                <i className="fas fa-sync"></i> Update
              </button>
            ) : (
              <Link
                to={`/folders/${id}/edit`}
                className="flex-1 sm:flex-initial text-center bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition text-sm whitespace-nowrap"
              >
                <i className="fas fa-edit"></i> Edit
              </Link>
            )}
            <Link
              to={`/shares/folders/${id}`}
              className="flex-1 sm:flex-initial text-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm whitespace-nowrap"
            >
              <i className="fas fa-share-alt"></i> Share
            </Link>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 sm:flex-initial bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition text-sm whitespace-nowrap"
            >
              <i className="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Cards</p>
          <p className="text-2xl font-bold text-gray-800">{flashcardsCount}</p>
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
            {flashcardsCount - (stats.learned || 0)}
          </p>
        </div>
      </div>

      {/* Study Options */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          <i className="fas fa-bolt text-yellow-500"></i> Study Options
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            to={`/study/folder/${id}`}
            className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition text-center"
          >
            <i className="fas fa-brain"></i> Long-term Learning
          </Link>
          <Link
            to={`/study/folder/${id}?mode=random&type=all`}
            className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition text-center"
          >
            <i className="fas fa-random"></i> Random All
          </Link>
          <Link
            to={`/study/folder/${id}?mode=random&type=starred`}
            className="bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition text-center"
          >
            <i className="fas fa-star"></i> Random Starred
          </Link>
        </div>
      </div>

      {/* Sets in Folder */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            <i className="fas fa-layer-group text-blue-500"></i> Sets ({sets.length})
          </h2>
          {!isCloned && (
            <Link
              to={`/folders/${id}/manage-sets`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm text-center"
            >
              <i className="fas fa-plus"></i> Manage Sets
            </Link>
          )}
        </div>

        {/* Sets List */}
        {sets.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-layer-group text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No sets in this folder yet</h3>
            <p className="text-gray-600 mb-4">Add sets to this folder to start studying!</p>
            {!isCloned && (
              <Link
                to={`/folders/${id}/manage-sets`}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <i className="fas fa-plus"></i> Add Sets
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sets.map((set) => (
              <div
                key={set.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-800 flex-1">
                    <Link to={`/sets/${set.id}`} className="hover:text-blue-600">
                      {set.name}
                    </Link>
                  </h3>
                </div>
                {set.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {set.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    <i className="fas fa-cards"></i> {set.flashcard_count || 0} cards
                  </span>
                  <div className="flex gap-2">
                    <Link
                      to={`/study/set/${set.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                    >
                      <i className="fas fa-brain"></i> Study
                    </Link>
                    <Link
                      to={`/sets/${set.id}`}
                      className="text-gray-600 hover:text-gray-800 text-sm font-semibold"
                    >
                      <i className="fas fa-eye"></i> View
                    </Link>
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
        title="Delete Folder"
        message="Are you sure? This will NOT delete the sets inside, just remove them from this folder."
        confirmText="Delete"
        variant="danger"
      />

      {/* Update from Source Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        onConfirm={handleUpdateFromSource}
        title="Update from Source"
        message="This will replace all sets and flashcards with the latest from source. Your learning progress will be kept. Continue?"
        confirmText="Update"
      />
    </div>
  );
}
