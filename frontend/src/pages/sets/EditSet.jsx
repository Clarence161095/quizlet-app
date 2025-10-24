import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EditSet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { flashSuccess, flashError } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    folder_id: ''
  });
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [setRes, foldersRes] = await Promise.all([
        api.get(`/api/sets/${id}`),
        api.get('/api/folders')
      ]);

      setFormData({
        name: setRes.data.name,
        description: setRes.data.description || '',
        folder_id: setRes.data.folder_id || ''
      });
      setFolders(foldersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        name: formData.name,
        description: formData.description
      };

      // Only include folder_id if selected
      if (formData.folder_id) {
        submitData.folder_id = parseInt(formData.folder_id);
      }

      await api.put(`/api/sets/${id}`, submitData);
      flashSuccess('Set updated successfully!');
      navigate(`/sets/${id}`);
    } catch (error) {
      console.error('Failed to update set:', error);
      flashError(error.response?.data?.error || 'Failed to update set. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
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
          <i className="fas fa-edit text-blue-600"></i> Edit Set
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Set Name */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
              Set Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              Add a brief description about this set (optional)
            </p>
          </div>

          {/* Folder */}
          <div className="mb-6">
            <label htmlFor="folder_id" className="block text-gray-700 font-semibold mb-2">
              Folder
            </label>
            <select
              id="folder_id"
              name="folder_id"
              value={formData.folder_id}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">No Folder</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Organize this set into a folder (optional)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-save"></i> {submitting ? 'Saving...' : 'Save Changes'}
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
