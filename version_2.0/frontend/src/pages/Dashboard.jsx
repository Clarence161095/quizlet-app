import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { flashError, updatePendingShares } = useApp();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data);
      updatePendingShares(response.data.pendingShares.total);
      setLoading(false);
    } catch (error) {
      flashError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const { stats, pendingShares, recentCards, sets, folders } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user.username}! 👋
        </h1>
        <p className="text-blue-100">
          Ready to continue your learning journey?
        </p>
      </div>

      {/* Pending Shares Alert */}
      {pendingShares.total > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <i className="fas fa-bell text-yellow-600 text-xl mr-3"></i>
            <div>
              <p className="font-semibold text-yellow-800">
                You have {pendingShares.total} pending share{pendingShares.total > 1 ? 's' : ''}
              </p>
              <Link to="/shares" className="text-sm text-yellow-600 hover:underline">
                View pending shares →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="fa-layer-group"
          title="Sets"
          value={stats.totalSets}
          color="blue"
          link="/sets"
        />
        <StatCard
          icon="fa-folder"
          title="Folders"
          value={stats.totalFolders}
          color="purple"
          link="/folders"
        />
        <StatCard
          icon="fa-clone"
          title="Flashcards"
          value={stats.totalFlashcards}
          color="green"
          link="/sets"
        />
        <StatCard
          icon="fa-chart-line"
          title="Learned"
          value={stats.learned}
          subtitle={`${stats.learning} learning, ${stats.new} new`}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/sets/create"
          className="card hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 text-blue-600 p-4 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <i className="fas fa-plus text-2xl"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Create Set</h3>
              <p className="text-sm text-gray-600">Start a new flashcard set</p>
            </div>
          </div>
        </Link>

        <Link
          to="/folders/create"
          className="card hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 text-purple-600 p-4 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <i className="fas fa-folder-plus text-2xl"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Create Folder</h3>
              <p className="text-sm text-gray-600">Organize your sets</p>
            </div>
          </div>
        </Link>

        <Link
          to="/shares"
          className="card hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 text-green-600 p-4 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
              <i className="fas fa-share-alt text-2xl"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">My Shares</h3>
              <p className="text-sm text-gray-600">Manage shared content</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Sets and Folders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              <i className="fas fa-layer-group mr-2 text-blue-600"></i>
              Recent Sets
            </h2>
            <Link to="/sets" className="text-sm text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          
          {sets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No sets yet. Create your first set to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {sets.map((set) => (
                <Link
                  key={set.id}
                  to={`/sets/${set.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-800">{set.name}</h3>
                  {set.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {set.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Folders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              <i className="fas fa-folder mr-2 text-purple-600"></i>
              Recent Folders
            </h2>
            <Link to="/folders" className="text-sm text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          
          {folders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No folders yet. Create a folder to organize your sets!
            </p>
          ) : (
            <div className="space-y-3">
              {folders.map((folder) => (
                <Link
                  key={folder.id}
                  to={`/folders/${folder.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-800">{folder.name}</h3>
                  {folder.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {folder.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ icon, title, value, subtitle, color, link }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  const content = (
    <div className="card border-2 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4">
        <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
          <i className={`fas ${icon} text-3xl`}></i>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

export default Dashboard;
