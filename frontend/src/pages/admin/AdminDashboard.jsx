import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const { flashError } = useApp();
  const [stats, setStats] = useState({ totalUsers: 0, adminUsers: 0, recentUsers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      flashError('Failed to load admin stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        <i className="fas fa-shield-alt text-red-600"></i> Admin Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalUsers}</p>
            </div>
            <i className="fas fa-users text-4xl text-blue-500"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Admin Users</p>
              <p className="text-3xl font-bold text-gray-800">{stats.adminUsers}</p>
            </div>
            <i className="fas fa-user-shield text-4xl text-red-500"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Regular Users</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalUsers - stats.adminUsers}</p>
            </div>
            <i className="fas fa-user text-4xl text-green-500"></i>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          <i className="fas fa-bolt text-yellow-500"></i> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users/create"
            className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition text-center font-semibold"
          >
            <i className="fas fa-user-plus text-xl mb-2 block"></i>
            Create New User
          </Link>
          <Link
            to="/admin/users"
            className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition text-center font-semibold"
          >
            <i className="fas fa-list text-xl mb-2 block"></i>
            Manage Users
          </Link>
          <Link
            to="/dashboard"
            className="bg-gray-600 text-white px-6 py-4 rounded-lg hover:bg-gray-700 transition text-center font-semibold"
          >
            <i className="fas fa-home text-xl mb-2 block"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          <i className="fas fa-clock text-blue-500"></i> Recent Users
        </h2>
        {stats.recentUsers.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No recent users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentUsers.map((user) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
