import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';
import UserService from '../services/UserService';
import WorkflowService from '../services/WorkflowService';
import './page styles/CreateWorkflow.css';

const CreateWorkflow = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToRole, setAssignedToRole] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();

  // Define available roles based on current user's role
  const getAvailableRoles = () => {
    if (!currentUser) return [];
    
    switch(currentUser.role) {
      case 'ADMIN':
        return ['ADMIN', 'MANAGER', 'STAFF'];
      case 'MANAGER':
        return ['MANAGER', 'STAFF'];
      case 'STAFF':
        return ['STAFF'];
      default:
        return [];
    }
  };

  useEffect(() => {
    // First check authentication before doing anything else
    if (!AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        let users = [];
        const userRole = currentUser?.role;
        
        if (userRole === 'ADMIN') {
          users = await UserService.getAllUsers();
        } else if (userRole === 'MANAGER') {
          const managers = await UserService.getUsersByRole('MANAGER');
          const staff = await UserService.getUsersByRole('STAFF');
          users = [...managers, ...staff];
        } else if (userRole === 'STAFF') {
          users = await UserService.getUsersByRole('STAFF');
        }
        
        setAllUsers(users);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  // Update filtered users whenever assignedToRole changes
  useEffect(() => {
    if (!assignedToRole) {
      setFilteredUsers([]);
      setAssignedTo(''); // Reset assigned user when role is cleared
      return;
    }
    
    // Filter users by selected role
    const usersWithSelectedRole = allUsers.filter(user => user.role === assignedToRole);
    setFilteredUsers(usersWithSelectedRole);
    
    // Reset the selected user if they don't match the new role
    if (assignedTo) {
      const userStillValid = usersWithSelectedRole.some(user => user.email === assignedTo);
      if (!userStillValid) {
        setAssignedTo('');
      }
    }
  }, [assignedToRole, allUsers, assignedTo]);

  // Handle user selection
  const handleUserChange = (e) => {
    const selectedEmail = e.target.value;
    console.log('Selected user email:', selectedEmail); // Debug logging
    setAssignedTo(selectedEmail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !assignedTo || !assignedToRole) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Create workflow object matching backend expectations
    const workflowData = {
      title: title.trim(),
      description: description.trim(),
      assignedTo, // This should match what the backend expects (email or username)
      assignedToRole,
      dueDate: dueDate || null
      // No status field - backend will set it to PENDING by default
    };
    
    console.log('Submitting workflow data:', workflowData); // Debug logging
    
    try {
      setSubmitting(true);
      setError(null);
      
      const result = await WorkflowService.createWorkflow(workflowData);
      console.log('Workflow created:', result);
      
      setSubmitStatus('success');
      setTimeout(() => {
        navigate('/workflows/all');
      }, 1500);
    } catch (err) {
      console.error('Error creating workflow:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication error. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.data?.message) {
        setError(`Failed to create workflow: ${err.response.data.message}`);
      } else {
        setError('Failed to create workflow. Please try again.');
      }
      
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/workflows/all');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="create-workflow">
      <h2>Create New Workflow</h2>
      
      {error && <div className="error-message">{error}</div>}
      {submitStatus === 'success' && (
        <div className="success-message">Workflow created successfully!</div>
      )}
      
      <form onSubmit={handleSubmit} className="workflow-form">
        <div className="form-group">
          <label htmlFor="title">Title <span className="required">*</span></label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description <span className="required">*</span></label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            required
            disabled={submitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="assignedToRole">Assign To Role <span className="required">*</span></label>
          <select 
            id="assignedToRole"
            value={assignedToRole}
            onChange={(e) => setAssignedToRole(e.target.value)}
            required
            disabled={submitting}
          >
            <option value="">Select role</option>
            {getAvailableRoles().map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="assignee">Assign To <span className="required">*</span></label>
          <select 
            id="assignee"
            value={assignedTo}
            onChange={handleUserChange}
            required
            disabled={submitting || !assignedToRole}
          >
            <option value="">Select user</option>
            {filteredUsers.map(user => (
              <option key={user.id} value={user.email}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
        </div>
        
        <div className="workflow-status-note">
          <p>Note: All new workflows are created with status <strong>PENDING</strong> by default.</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={submitting}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button" 
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Workflow'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateWorkflow;