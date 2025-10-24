import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function EditFolder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { flashSuccess, flashError } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFolder();
  }, [id]);

  const fetchFolder = async () => {
    try {
      const response = await api.get(`/api/folders/${id}`);
      setFormData({
        name: response.data.name,
        description: response.data.description || ''
      });
    } catch (error) {
      console.error('Failed to fetch folder:', error);
      flashError('Failed to load folder details. Please try again.');
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
      await api.put(`/api/folders/${id}`, formData);
      flashSuccess('Folder updated successfully!');
      navigate(`/folders/${id}`);
    } catch (error) {
      console.error('Failed to update folder:', error);
      flashError(error.response?.data?.error || 'Failed to update folder. Please try again.');
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
        <Link to={`/folders/${id}`} className="text-blue-600 hover:underline">
          <i className="fas fa-arrow-left"></i> Back to Folder
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          <i className="fas fa-edit text-yellow-600"></i> Edit Folder
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
            />
            <p className="text-sm text-gray-500 mt-2">
              Add a brief description about this folder (optional)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-save"></i> {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              to={`/folders/${id}`}
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
