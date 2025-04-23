import axios from 'axios';
import authService from './authService';


const API_URL = 'http://localhost:8080/api';

class UserService {
  async getAllUsers() {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const response = await axios.post(`${API_URL}/users`, userData, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, userData, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const response = await axios.delete(`${API_URL}/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }

  async getUsersByRole(role) {
    try {
      const response = await axios.get(`${API_URL}/users/role/${role}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }
  }

  async changeUserRole(userId, newRole) {
    try {
      const response = await axios.post(
        `${API_URL}/users/${userId}/role?newRole=${newRole}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error changing role for user with ID ${userId}:`, error);
      throw error;
    }
  }
}

export default new UserService();