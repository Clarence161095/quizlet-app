import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ManageSets() {
  const { id } = useParams();
  const { flashSuccess, flashError } = useApp();

  const [folder, setFolder] = useState(null);
  const [currentSets, setCurrentSets] = useState([]);
  const [availableSets, setAvailableSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [folderRes, currentRes, allSetsRes] = await Promise.all([
        api.get(`/api/folders/${id}`),
        api.get(`/api/folders/${id}/sets`),
        api.get('/api/sets')
      ]);

      setFolder(folderRes.data);
      setCurrentSets(currentRes.data);

      // Filter available sets (not already in folder)
      const currentSetIds = currentRes.data.map(s => s.id);
      const available = allSetsRes.data.filter(s => !currentSetIds.includes(s.id));
      setAvailableSets(available);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      flashError('Failed to load folder data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSet = async (setId) => {
    try {
      await api.post(`/api/folders/${id}/sets`, { setId });
      flashSuccess('Set added to folder successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to add set:', error);
      flashError(error.response?.data?.error || 'Failed to add set. Please try again.');
    }
  };

  const handleRemoveSet = async (setId) => {
    if (!confirm('Remove this set from the folder?')) return;

    try {
      await api.delete(`/api/folders/${id}/sets/${setId}`);
      flashSuccess('Set removed from folder successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Failed to remove set:', error);
      flashError(error.response?.data?.error || 'Failed to remove set. Please try again.');
    }
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to={`/folders/${id}`} className="text-blue-600 hover:underline">
          <i className="fas fa-arrow-left"></i> Back to Folder
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          <i className="fas fa-layer-group text-blue-600"></i> Manage Sets
        </h1>
        <p className="text-gray-600">Add or remove sets from "{folder.name}"</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Sets in Folder */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            <i className="fas fa-check-circle text-green-600"></i> Sets in This Folder
            <span className="text-sm font-normal text-gray-500">({currentSets.length})</span>
          </h2>

          {currentSets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-folder-open text-4xl mb-2"></i>
              <p>No sets in this folder yet</p>
              <p className="text-sm">Add sets from the available list →</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentSets.map((set) => (
                <div
                  key={set.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        <Link to={`/sets/${set.id}`} className="hover:text-blue-600">
                          {set.name}
                        </Link>
                      </h3>
                      {set.description && (
                        <p className="text-sm text-gray-600 mb-2">{set.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        <i className="fas fa-clock"></i>{' '}
                        {new Date(set.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveSet(set.id)}
                      className="ml-4 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                    >
                      <i className="fas fa-times"></i> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Sets to Add */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            <i className="fas fa-plus-circle text-blue-600"></i> Available Sets
            <span className="text-sm font-normal text-gray-500">({availableSets.length})</span>
          </h2>

          {availableSets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-check-double text-4xl mb-2"></i>
              <p>All your sets are already in this folder!</p>
              <p className="text-sm mt-2">
                <Link to="/sets/create" className="text-blue-600 hover:underline">
                  <i className="fas fa-plus"></i> Create a new set
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableSets.map((set) => (
                <div
                  key={set.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        <Link to={`/sets/${set.id}`} className="hover:text-blue-600">
                          {set.name}
                        </Link>
                      </h3>
                      {set.description && (
                        <p className="text-sm text-gray-600 mb-2">{set.description}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        <i className="fas fa-clock"></i>{' '}
                        {new Date(set.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddSet(set.id)}
                      className="ml-4 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition text-sm"
                    >
                      <i className="fas fa-plus"></i> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-2">
          <i className="fas fa-info-circle text-blue-600"></i> About Many-to-Many Folders
        </h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>
            <i className="fas fa-check text-green-600"></i> A set can belong to multiple folders
          </li>
          <li>
            <i className="fas fa-check text-green-600"></i> Removing a set from a folder doesn't delete the set
          </li>
          <li>
            <i className="fas fa-check text-green-600"></i> Your learning progress is preserved across all folders
          </li>
          <li>
            <i className="fas fa-check text-green-600"></i> Study a folder to practice all its sets together
          </li>
        </ul>
      </div>
    </div>
  );
}
