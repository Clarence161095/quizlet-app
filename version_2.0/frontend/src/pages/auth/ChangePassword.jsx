import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { changePassword } = useAuth();
  const { flashError, flashSuccess } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (newPassword !== confirmPassword) {
      flashError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      flashError('Password must be at least 6 characters');
      return;
    }

    if (currentPassword === newPassword) {
      flashError('New password must be different from current password');
      return;
    }

    setLoading(true);

    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      flashSuccess('Password changed successfully!');
      navigate('/dashboard');
    } else {
      flashError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <i className="fas fa-key text-blue-600 text-5xl mb-4"></i>
          <h1 className="text-3xl font-bold text-gray-800">Change Password</h1>
          <p className="text-gray-600 mt-2">Update your account password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <i className="fas fa-lock mr-2"></i>Current Password
            </label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">
              <i className="fas fa-lock mr-2"></i>New Password
            </label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div>
            <label className="label">
              <i className="fas fa-lock mr-2"></i>Confirm New Password
            </label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
