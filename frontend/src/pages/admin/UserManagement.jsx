import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function UserManagement() {
  const { flashSuccess, flashError } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      flashError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/api/admin/users/${userToDelete.id}`);
      flashSuccess(`User "${userToDelete.username}" deleted successfully!`);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to delete user:', error);
      flashError(error.response?.data?.error || 'Failed to delete user.');
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleToggleAdmin = async (userId, currentStatus) => {
    if (!confirm(`${currentStatus ? 'Remove' : 'Grant'} admin privileges for this user?`)) return;

    try {
      await api.patch(`/api/admin/users/${userId}/toggle-admin`);
      flashSuccess('User privileges updated successfully!');
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to toggle admin:', error);
      flashError(error.response?.data?.error || 'Failed to update user privileges.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          <i className="fas fa-users text-blue-600"></i> User Management
        </h1>
        <div className="flex gap-2">
          <Link
            to="/admin/users/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            <i className="fas fa-user-plus"></i> Create User
          </Link>
          <Link
            to="/admin"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition whitespace-nowrap"
          >
            <i className="fas fa-arrow-left"></i> Back
          </Link>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MFA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <i className={`fas ${user.is_admin ? 'fa-user-shield text-red-500' : 'fa-user text-blue-500'} mr-2`}></i>
                      <span className="font-medium text-gray-900">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      user.is_admin ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.mfa_enabled ? (
                      <span className="text-green-600">
                        <i className="fas fa-check-circle"></i> Enabled
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        <i className="fas fa-times-circle"></i> Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                        className={`${
                          user.is_admin ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                        }`}
                        title={user.is_admin ? 'Remove admin' : 'Make admin'}
                      >
                        <i className={`fas ${user.is_admin ? 'fa-user-minus' : 'fa-user-plus'}`}></i>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete user"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-600">No users found.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.username}"? This will also delete all their sets, flashcards, and learning progress. This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
