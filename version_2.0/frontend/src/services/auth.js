import api from './api';

/**
 * Auth Service - handles authentication operations
 */
const authService = {
  /**
   * Register new user
   */
  async register(username, password, email) {
    const response = await api.post('/auth/register', { username, password, email });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Login user
   */
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    
    // Check if MFA is required
    if (response.data.requireMFA) {
      return {
        requireMFA: true,
        userId: response.data.userId,
        username: response.data.username
      };
    }
    
    // Normal login success
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Verify MFA token
   */
  async verifyMFA(userId, token) {
    const response = await api.post('/auth/mfa/verify', { userId, token });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Setup MFA
   */
  async setupMFA(userId) {
    const response = await api.post('/auth/mfa/setup', { userId });
    return response.data; // { secret, qrCode }
  },

  /**
   * Verify MFA setup
   */
  async verifyMFASetup(userId, secret, token) {
    const response = await api.post('/auth/mfa/verify-setup', { userId, secret, token });
    return response.data;
  },

  /**
   * Disable MFA
   */
  async disableMFA(userId) {
    const response = await api.post('/auth/mfa/disable', { userId });
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      userId,
      currentPassword,
      newPassword
    });
    return response.data;
  },

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get stored user
   */
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Get stored token
   */
  getStoredToken() {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getStoredToken();
  }
};

export default authService;
