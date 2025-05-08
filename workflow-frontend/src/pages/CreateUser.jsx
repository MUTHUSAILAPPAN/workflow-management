import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserService from '../services/UserService';
import AuthService from '../services/authService';
import '../pages/page styles/CreateUser.css';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    role: 'STAFF'
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    
    // Set default role based on current user's permissions
    if (user.role === 'STAFF') {
      setFormData(prev => ({ ...prev, role: 'STAFF' }));
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 4) {
      newErrors.name = 'Name must be at least 4 characters';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Role validation based on current user's permissions
    if (currentUser) {
      if (currentUser.role === 'STAFF' && formData.role !== 'STAFF') {
        newErrors.role = 'You can only create staff accounts';
      } else if (currentUser.role === 'MANAGER' && formData.role === 'ADMIN') {
        newErrors.role = 'Managers cannot create admin accounts';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Prepare the user data for the backend
      const userToCreate = {
        name: formData.name.trim(),
        password: formData.password,
        email: formData.email.trim(),
        role: formData.role
      };
      
      const response = await UserService.createUser(userToCreate);
      setCreatedUser(response.data); // Store the created user data
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/users');
      }, 1500);
    } catch (error) {
      console.error('Create user error:', error);
      setApiError(
        error.response?.data?.message || 
        error.message || 
        'Failed to create user. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      navigate('/users');
    }
  };

  return (
    <div className="create-user-container">
      <div className="create-user-header">
        <h2>Create New User</h2>
        {currentUser?.role === 'ADMIN' && (
          <span className="admin-badge">Admin Mode</span>
        )}
      </div>
      
      {apiError && (
        <div className="alert alert-error">
          <p>{apiError}</p>
        </div>
      )}
      
      {success ? (
        <div className="alert alert-success">
          <p>
            User <strong>{createdUser?.name}</strong> ({createdUser?.email}) created successfully by {currentUser?.email}!
            {' '}Redirecting...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="create-user-form">
          <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
            <label htmlFor="name">Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-name"
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>
          
          <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
            <label htmlFor="password">Password*</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
          
          <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className={`form-group ${errors.role ? 'has-error' : ''}`}>
            <label htmlFor="role">Role*</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading || currentUser?.role === 'STAFF'}
            >
              {currentUser?.role === 'ADMIN' && <option value="ADMIN">Admin</option>}
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
                <option value="MANAGER">Manager</option>
              )}
              <option value="STAFF">Staff</option>
            </select>
            {errors.role && <span className="error-text">{errors.role}</span>}
          </div>

          {currentUser && (
            <div className="form-info">
              <p>This user will be created with your email ({currentUser.email}) as the creator.</p>
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateUser;