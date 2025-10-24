import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function FoldersList() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { flashError } = useApp();

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await api.get('/api/folders');
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      flashError('Failed to load folders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            <i className="fas fa-folder text-yellow-600"></i> My Folders
          </h1>
          <Link
            to="/folders/create"
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition"
          >
            <i className="fas fa-plus"></i> Create New Folder
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {folders.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <i className="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No folders yet</h2>
          <p className="text-gray-600 mb-6">Create folders to organize your study sets!</p>
          <Link
            to="/folders/create"
            className="inline-block bg-yellow-600 text-white px-8 py-3 rounded-lg hover:bg-yellow-700 text-lg"
          >
            <i className="fas fa-plus"></i> Create Your First Folder
          </Link>
        </div>
      ) : (
        /* Folders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="p-6">
                {/* Folder Title */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800 flex-1">
                    <Link
                      to={`/folders/${folder.id}`}
                      className="hover:text-yellow-600 flex items-center"
                    >
                      <i className="fas fa-folder text-yellow-500 mr-2"></i>
                      {folder.name}
                    </Link>
                  </h3>
                </div>

                {/* Description */}
                {folder.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {folder.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-600">
                    <i className="fas fa-layer-group"></i> {folder.set_count || 0} set{folder.set_count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-500">
                    <i className="fas fa-calendar"></i> {new Date(folder.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    to={`/folders/${folder.id}`}
                    className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition text-center text-sm"
                  >
                    <i className="fas fa-eye"></i> View
                  </Link>
                  <Link
                    to={`/folders/${folder.id}/edit`}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-center text-sm"
                  >
                    <i className="fas fa-edit"></i> Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
