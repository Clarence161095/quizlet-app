import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ShareFolder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { flashSuccess, flashError } = useApp();

  const [folder, setFolder] = useState(null);
  const [username, setUsername] = useState('');
  const [allowExport, setAllowExport] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFolder();
  }, [id]);

  const fetchFolder = async () => {
    try {
      const res = await api.get(`/api/folders/${id}`);
      setFolder(res.data);
    } catch (error) {
      console.error('Failed to fetch folder:', error);
      flashError('Failed to load folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      flashError('Please enter a username.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/shares/folders', {
        folderId: parseInt(id),
        username: username.trim(),
        allowExport
      });
      flashSuccess(`Folder shared with ${username} successfully!`);
      navigate('/shares');
    } catch (error) {
      console.error('Failed to share folder:', error);
      flashError(error.response?.data?.error || 'Failed to share folder. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!folder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Folder not found.</p>
        <button
          onClick={() => navigate('/folders')}
          className="text-blue-600 hover:underline mt-4"
        >
          Back to Folders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        <i className="fas fa-share-alt text-green-600"></i> Share Folder
      </h1>
      <p className="text-gray-600 mb-6">Share "{folder.name}" with another user</p>

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              <i className="fas fa-user"></i> Recipient Username *
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The user will receive a notification and can accept the share.
            </p>
          </div>

          {/* Allow Export Checkbox */}
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowExport}
                onChange={(e) => setAllowExport(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                <i className="fas fa-download text-blue-600"></i> Allow recipient to export sets in this folder
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              If unchecked, the recipient can only study but cannot export any sets in the folder.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              <i className="fas fa-info-circle"></i> How sharing works:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>A copy (clone) of your folder and all its sets will be created</li>
              <li>They can study all sets and track their own progress</li>
              <li>They can update their clone when you make changes to the original</li>
              <li>Their learning progress will be preserved when updating</li>
              <li>They cannot edit the cloned folder/sets directly (read-only)</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/folders/${id}`)}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              <i className="fas fa-times"></i> Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Sharing...
                </>
              ) : (
                <>
                  <i className="fas fa-share-alt"></i> Share Folder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
