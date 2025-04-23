// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth';

class AuthService {
  async login(username, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });
      
      if (response.data.token) {
        // Store both the user data and token separately for easier access
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
        
        // Set the default Authorization header for all future Axios requests
        this.setAuthHeader(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Remove Authorization header from future requests
    delete axios.defaults.headers.common['Authorization'];
  }

  async register(user) {
    try {
      const response = await axios.post(`${API_URL}/register`, user);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  getToken() {
    // First try to get from localStorage directly (more reliable)
    const token = localStorage.getItem('token');
    if (token) {
      return token;
    }
    
    // Fallback to getting from user object
    const user = this.getCurrentUser();
    return user?.token || null;
  }

  // Set Authorization header for all future requests
  setAuthHeader(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  // Initialize auth header from stored token (call this when app loads)
  initAuthHeader() {
    const token = this.getToken();
    if (token) {
      this.setAuthHeader(token);
    }
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  hasRole(requiredRole) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  }

  isAdmin() {
    return this.hasRole('ADMIN');
  }

  isManager() {
    return this.hasRole('MANAGER') || this.isAdmin();
  }

  isStaff() {
    return this.hasRole('STAFF') || this.isManager();
  }
}

// Create instance
const authService = new AuthService();

// Initialize authorization header from stored token when importing this service
authService.initAuthHeader();

export default authService;