import React, { useState, useEffect } from 'react';
import WorkflowService from '../services/WorkflowService';
import AuthService from '../services/authService';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import './page styles/WorkflowModal.css';

const WorkflowEditModal = ({ workflow, onClose, onUpdate, onDelete, currentUser, users, canDelete }) => {
  const [title, setTitle] = useState(workflow?.title || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [status, setStatus] = useState(workflow?.status || 'PENDING');
  const [assignedToRole, setAssignedToRole] = useState(workflow?.assignedToRole || '');
  
  // Store both the ID and name
  const [assignedToId, setAssignedToId] = useState(workflow?.assignedTo || '');
  const [assignedToName, setAssignedToName] = useState(workflow?.assignedToName || '');
  
  const [dueDate, setDueDate] = useState(workflow?.dueDate ? new Date(workflow.dueDate).toISOString().split('T')[0] : '');
  
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Initialize assignedToId and assignedToName from workflow data
  useEffect(() => {
    if (workflow) {
      // If we have the assignedTo field (email/ID) and users are loaded
      if (workflow.assignedTo && users.length > 0) {
        setAssignedToId(workflow.assignedTo);
        
        // Find the corresponding user to get their name
        const assignedUser = users.find(user => 
          user.email === workflow.assignedTo || user.id === workflow.assignedTo
        );
        
        if (assignedUser) {
          setAssignedToName(assignedUser.name);
        } else {
          // Fallback to whatever we have in assignedToName
          setAssignedToName(workflow.assignedToName || '');
        }
      }
    }
  }, [workflow, users]);
  
  // Check if user has full edit permissions or only status update permission
  const hasFullEditPermission = currentUser?.role === 'ADMIN' || 
                               workflow?.createdBy === currentUser?.username;
  
  // Available roles based on current user's role
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
  
  // Filter users by selected role
  useEffect(() => {
    if (!assignedToRole) {
      setFilteredUsers([]);
      return;
    }
    
    const usersWithRole = users.filter(user => user.role === assignedToRole);
    setFilteredUsers(usersWithRole);
    
    // If current assignedTo doesn't match role, reset it
    if (assignedToId) {
      const userStillValid = usersWithRole.some(user => 
        user.id === assignedToId || user.email === assignedToId
      );
      
      if (!userStillValid) {
        setAssignedToId('');
        setAssignedToName('');
      }
    }
  }, [assignedToRole, users, assignedToId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let updatedWorkflow = { id: workflow.id };
    
    // For admin or creator, allow all fields to be updated
    if (hasFullEditPermission) {
      updatedWorkflow = {
        ...updatedWorkflow,
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedToId, // Use ID/email for backend
        assignedToName: assignedToName, // Include the name for UI display
        assignedToRole,
        status,
        dueDate: dueDate || null
      };
    } else {
      // For assignee, only allow status update
      updatedWorkflow = {
        ...updatedWorkflow,
        status
      };
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await WorkflowService.updateWorkflow(workflow.id, updatedWorkflow);
      console.log('Workflow updated:', result);
      
      setSuccess(true);
      // Call the onUpdate callback with the updated workflow
      onUpdate(result);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating workflow:', err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication error. Please log in again.');
        AuthService.logout(); // Clear invalid tokens
        setTimeout(() => onClose(), 2000);
      } else if (err.response?.data?.message) {
        setError(`Failed to update workflow: ${err.response.data.message}`);
      } else {
        setError('Failed to update workflow. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };
  
  // Handle user selection
  const handleUserChange = (e) => {
    const userId = e.target.value;
    setAssignedToId(userId);
    
    // Find the user to get their name
    if (userId) {
      const selectedUser = filteredUsers.find(user => 
        user.id === userId || user.email === userId
      );
      
      if (selectedUser) {
        setAssignedToName(selectedUser.name);
      }
    } else {
      setAssignedToName('');
    }
  };

  return (
    <div className="workflow-modal-overlay">
      <div className="workflow-modal-card">
        <div className="modal-header">
          <h2>{hasFullEditPermission ? 'Edit Workflow' : 'Update Workflow Status'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Workflow updated successfully!</div>}
          
          <form onSubmit={handleSubmit} className="workflow-form">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            
            {hasFullEditPermission && (
              <>
                <div className="form-group">
                  <label htmlFor="title">Title <span className="required">*</span></label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="assignedToRole">Assign To Role <span className="required">*</span></label>
                  <select 
                    id="assignedToRole"
                    value={assignedToRole}
                    onChange={(e) => setAssignedToRole(e.target.value)}
                    required
                    disabled={loading}
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
                    value={assignedToId}
                    onChange={handleUserChange}
                    required
                    disabled={loading || !assignedToRole}
                  >
                    <option value="">Select user</option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={user.email || user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </>
            )}
            
            <div className="modal-footer">
              {canDelete && (
                <button
                  type="button"
                  className="delete-btn"
                  onClick={handleDeleteClick}
                  disabled={loading}
                >
                  Delete Workflow
                </button>
              )}
              <div className="modal-action-buttons">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary-btn" 
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Workflow'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          title={workflow.title}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete(workflow.id);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowEditModal;