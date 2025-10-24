import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';

export default function CreateSet() {
  const navigate = useNavigate();
  const { flashSuccess, flashError } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    folder_id: ''
  });
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const response = await api.get('/api/folders');
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

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
      const submitData = {
        name: formData.name,
        description: formData.description
      };

      // Only include folder_id if selected
      if (formData.folder_id) {
        submitData.folder_id = parseInt(formData.folder_id);
      }

      const response = await api.post('/api/sets', submitData);
      flashSuccess('Set created successfully!');
      navigate(`/sets/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create set:', error);
      flashError(error.response?.data?.error || 'Failed to create set. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          <i className="fas fa-plus-circle text-blue-600"></i> Create New Set
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Set Name */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold" htmlFor="name">
              Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E.g., English Vocabulary - Unit 1"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-semibold" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description for this set"
            />
          </div>

          {/* Folder Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-semibold" htmlFor="folder_id">
              Folder (Optional)
            </label>
            <select
              id="folder_id"
              name="folder_id"
              value={formData.folder_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- No Folder --</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              <i className="fas fa-info-circle"></i> Organize sets into folders for better management
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-save"></i> {loading ? 'Creating...' : 'Create Set'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/sets')}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          <i className="fas fa-lightbulb"></i> What's next?
        </h3>
        <p className="text-sm text-blue-700">
          After creating a set, you can add flashcards manually or import them from text.
        </p>
      </div>
    </div>
  );
}
