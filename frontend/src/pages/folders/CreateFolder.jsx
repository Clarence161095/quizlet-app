import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';

export default function CreateFolder() {
  const navigate = useNavigate();
  const { flashSuccess, flashError } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/folders', formData);
      flashSuccess('Folder created successfully!');
      navigate(`/folders/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create folder:', error);
      flashError(error.response?.data?.error || 'Failed to create folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/folders" className="text-blue-600 hover:underline">
          <i className="fas fa-arrow-left"></i> Back to Folders
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          <i className="fas fa-folder-plus text-yellow-600"></i> Create New Folder
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Folder Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
              Folder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500"
              placeholder="e.g., Spanish Vocabulary"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500"
              placeholder="Add a brief description about this folder (optional)"
            />
            <p className="text-sm text-gray-500 mt-2">Help you remember what this folder is for</p>
          </div>

          {/* Tip Box */}
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <p className="text-sm text-gray-700">
              <i className="fas fa-lightbulb text-yellow-600"></i>
              {' '}<strong>Tip:</strong> Use folders to organize related study sets by topic, course, or subject.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-save"></i> {loading ? 'Creating...' : 'Create Folder'}
            </button>
            <Link
              to="/folders"
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
