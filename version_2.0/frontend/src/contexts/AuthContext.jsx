import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaTempData, setMfaTempData] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedUser = authService.getStoredUser();
      const token = authService.getStoredToken();
      
      if (storedUser && token) {
        setUser(storedUser);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Register new user
   */
  const register = async (username, password, email) => {
    try {
      const data = await authService.register(username, password, email);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  };

  /**
   * Login user
   */
  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      
      // Check if MFA is required
      if (data.requireMFA) {
        setMfaRequired(true);
        setMfaTempData({
          userId: data.userId,
          username: data.username
        });
        return { success: true, requireMFA: true };
      }
      
      // Normal login success
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  };

  /**
   * Verify MFA token
   */
  const verifyMFA = async (token) => {
    try {
      if (!mfaTempData) {
        throw new Error('No MFA session data');
      }
      
      const data = await authService.verifyMFA(mfaTempData.userId, token);
      setUser(data.user);
      setMfaRequired(false);
      setMfaTempData(null);
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.error || 'MFA verification failed';
      return { success: false, error: message };
    }
  };

  /**
   * Setup MFA for admin
   */
  const setupMFA = async (userId) => {
    try {
      const data = await authService.setupMFA(userId);
      return { success: true, ...data };
    } catch (error) {
      const message = error.response?.data?.error || 'MFA setup failed';
      return { success: false, error: message };
    }
  };

  /**
   * Verify MFA setup
   */
  const verifyMFASetup = async (userId, secret, token) => {
    try {
      await authService.verifyMFASetup(userId, secret, token);
      
      // Update user MFA status
      const updatedUser = { ...user, mfa_enabled: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'MFA verification failed';
      return { success: false, error: message };
    }
  };

  /**
   * Disable MFA
   */
  const disableMFA = async (userId) => {
    try {
      await authService.disableMFA(userId);
      
      // Update user MFA status
      const updatedUser = { ...user, mfa_enabled: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to disable MFA';
      return { success: false, error: message };
    }
  };

  /**
   * Change password
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(user.id, currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to change password';
      return { success: false, error: message };
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: 'Failed to refresh user data' };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setMfaRequired(false);
    setMfaTempData(null);
  };

  const value = {
    user,
    loading,
    mfaRequired,
    mfaTempData,
    register,
    login,
    logout,
    verifyMFA,
    setupMFA,
    verifyMFASetup,
    disableMFA,
    changePassword,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
