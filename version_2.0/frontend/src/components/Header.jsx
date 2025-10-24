import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import api from '../services/api';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { pendingSharesCount, updatePendingShares } = useApp();
  const navigate = useNavigate();

  // Fetch pending shares count
  useEffect(() => {
    if (user) {
      fetchPendingShares();
    }
  }, [user]);

  const fetchPendingShares = async () => {
    try {
      const response = await api.get('/shares/pending-count');
      updatePendingShares(response.data.total);
    } catch (error) {
      console.error('Failed to fetch pending shares count:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <i className="fas fa-brain text-blue-600 text-2xl"></i>
            <span className="text-xl font-bold text-gray-800">Qi Learning</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="nav-link">
              <i className="fas fa-home mr-2"></i>Dashboard
            </Link>
            <Link to="/sets" className="nav-link">
              <i className="fas fa-layer-group mr-2"></i>Sets
            </Link>
            <Link to="/folders" className="nav-link">
              <i className="fas fa-folder mr-2"></i>Folders
            </Link>
            <Link to="/shares" className="nav-link relative">
              <i className="fas fa-share-alt mr-2"></i>Shares
              {pendingSharesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingSharesCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link to="/admin" className="nav-link">
                <i className="fas fa-user-shield mr-2"></i>Admin
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-sm text-gray-600">
              <i className="fas fa-user-circle mr-2"></i>
              {user.username}
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline text-sm"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-gray-600">
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>

      <style jsx>{`
        .nav-link {
          @apply text-gray-600 hover:text-blue-600 transition-colors font-medium;
        }
      `}</style>
    </header>
  );
};

export default Header;
