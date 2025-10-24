import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function SetsList() {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { flashError } = useApp();

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const response = await api.get('/api/sets');
      setSets(response.data);
    } catch (error) {
      console.error('Failed to fetch sets:', error);
      flashError('Failed to load sets. Please try again.');
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
            <i className="fas fa-layer-group text-blue-600"></i> My Sets
          </h1>
          <Link
            to="/sets/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <i className="fas fa-plus"></i> Create New Set
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {sets.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <i className="fas fa-layer-group text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No sets yet</h2>
          <p className="text-gray-600 mb-6">Create your first set to start learning!</p>
          <Link
            to="/sets/create"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 text-lg"
          >
            <i className="fas fa-plus"></i> Create Your First Set
          </Link>
        </div>
      ) : (
        /* Sets Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="p-6">
                {/* Set Title */}
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-800 flex-1">
                    <Link
                      to={`/sets/${set.id}`}
                      className="hover:text-blue-600"
                    >
                      {set.name}
                    </Link>
                  </h3>
                </div>

                {/* Description */}
                {set.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {set.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                  <span>
                    <i className="fas fa-folder"></i>{' '}
                    {set.folder_names || 'No folder'}
                  </span>
                  <span>
                    <i className="fas fa-calendar"></i>{' '}
                    {new Date(set.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    to={`/sets/${set.id}/study`}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-center text-sm"
                  >
                    <i className="fas fa-brain"></i> Study
                  </Link>
                  <Link
                    to={`/sets/${set.id}`}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-center text-sm"
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
  );
}
