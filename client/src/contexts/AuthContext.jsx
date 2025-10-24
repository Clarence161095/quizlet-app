import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  // Check session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await authService.checkSession();
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        setMfaRequired(data.mfaRequired || false);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setMfaRequired(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setMfaRequired(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      
      if (data.mfaRequired) {
        setMfaRequired(true);
        return { mfaRequired: true };
      }

      setUser(data.user);
      setIsAuthenticated(true);
      setMfaRequired(false);
      return { success: true, user: data.user };
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setMfaRequired(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const verifyMFA = async (token) => {
    try {
      const data = await authService.verifyMFA(token);
      setUser(data.user);
      setIsAuthenticated(true);
      setMfaRequired(false);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    mfaRequired,
    login,
    logout,
    verifyMFA,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
