import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600">
            <i className="fas fa-book-reader mr-2"></i>
            Qi Learning
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition">
              <i className="fas fa-home mr-1"></i> Dashboard
            </Link>
            <Link to="/sets" className="text-gray-700 hover:text-blue-600 transition">
              <i className="fas fa-layer-group mr-1"></i> Sets
            </Link>
            <Link to="/folders" className="text-gray-700 hover:text-blue-600 transition">
              <i className="fas fa-folder mr-1"></i> Folders
            </Link>
            <Link to="/shares" className="text-gray-700 hover:text-blue-600 transition">
              <i className="fas fa-share-alt mr-1"></i> Shares
            </Link>
            
            {user?.is_admin && (
              <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition">
                <i className="fas fa-user-shield mr-1"></i> Admin
              </Link>
            )}

            {/* User Dropdown */}
            <div className="relative group">
              <button className="text-gray-700 hover:text-blue-600 transition">
                <i className="fas fa-user-circle mr-1"></i> {user?.username}
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                <Link
                  to="/auth/change-password"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <i className="fas fa-key mr-2"></i> Change Password
                </Link>
                {user?.is_admin && (
                  <Link
                    to="/auth/mfa-setup"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fas fa-shield-alt mr-2"></i> MFA Setup
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i> Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-2xl`}></i>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <Link
              to="/dashboard"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-home mr-2"></i> Dashboard
            </Link>
            <Link
              to="/sets"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-layer-group mr-2"></i> Sets
            </Link>
            <Link
              to="/folders"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-folder mr-2"></i> Folders
            </Link>
            <Link
              to="/shares"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="fas fa-share-alt mr-2"></i> Shares
            </Link>
            
            {user?.is_admin && (
              <Link
                to="/admin"
                className="block py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-user-shield mr-2"></i> Admin
              </Link>
            )}

            <div className="border-t mt-2 pt-2">
              <Link
                to="/auth/change-password"
                className="block py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="fas fa-key mr-2"></i> Change Password
              </Link>
              {user?.is_admin && (
                <Link
                  to="/auth/mfa-setup"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className="fas fa-shield-alt mr-2"></i> MFA Setup
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-gray-700 hover:text-blue-600"
              >
                <i className="fas fa-sign-out-alt mr-2"></i> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
