const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Authenticate user and get token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data including token
 */
export const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
  
      // Check if response is ok before attempting to parse JSON
      if (!response.ok) {
        // Try to parse error JSON, but handle case where it's not valid JSON
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Login failed with status: ${response.status}`);
        } catch (jsonError) {
          throw new Error(`Login failed with status: ${response.status}`);
        }
      }
  
      // Check if response has content before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON response');
      }
  
      const text = await response.text(); // Get as text first
      if (!text) {
        throw new Error('Server returned empty response');
      }
  
      // Now try to parse the text as JSON
      try {
        const data = JSON.parse(text);
        return data;
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user data
 */
export const register = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Log the user out by removing stored credentials
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Get the current logged in user
 * @returns {Object|null} User object or null if not logged in
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

/**
 * Check if user token is still valid
 * @returns {Promise<boolean>} True if token is valid
 */
export const validateToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

/**
 * Get auth header for protected API calls
 * @returns {Object} Headers with Authorization token
 */
export const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};