import api from './api';

export const authService = {
  // Login
  async login(username, password) {
    const response = await api.post('/api/auth/login', { username, password });
    return response.data;
  },

  // Logout
  async logout() {
    const response = await api.post('/api/auth/logout');
    return response.data;
  },

  // Check session
  async checkSession() {
    const response = await api.get('/api/auth/session');
    return response.data;
  },

  // MFA Verify
  async verifyMFA(token) {
    const response = await api.post('/api/auth/mfa-verify', { token });
    return response.data;
  },

  // MFA Setup
  async getMFASetup() {
    const response = await api.get('/api/auth/mfa-setup');
    return response.data;
  },

  async completeMFASetup(token) {
    const response = await api.post('/api/auth/mfa-setup', { token });
    return response.data;
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
