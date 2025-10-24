import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api', // Proxied to backend by Vite
  timeout: 30000,
  withCredentials: true, // Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access denied:', error.response.data.error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
